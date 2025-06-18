import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove, onDisconnect, serverTimestamp, off } from 'firebase/database';
import '../styles/PartnerMode.css';
import AppleDefault from '../../images/appleDefault.svg';
import Apple1 from '../../images/apple1.svg';
import Apple2 from '../../images/apple2.svg';
import Apple3 from '../../images/apple3.svg';
import Apple4 from '../../images/apple4.svg';
import Apple5 from '../../images/apple5.svg';
import Apple6 from '../../images/apple6.svg';
import Apple7 from '../../images/apple7.svg';
import Apple8 from '../../images/apple8.svg';
import Apple9 from '../../images/apple9.svg';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyALsJ8vrLQFarMGcgQgTy-7SH75v1GZdQo",
    authDomain: "applegame-76846.firebaseapp.com",
    databaseURL: "https://applegame-76846-default-rtdb.firebaseio.com",
    projectId: "applegame-76846",
    storageBucket: "applegame-76846.firebasestorage.app",
    messagingSenderId: "225410842127",
    appId: "1:225410842127:web:e6a2e487f72f45e4286d7a",
    measurementId: "G-C2C4K8L1PV"
};

// Firebase 초기화 (안전하게)
let app;
let database;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const PartnerMode = ({ onBack }) => {
    console.log('PartnerMode component loaded'); // 디버깅용
    // 게임 설정
    const BOARD_SIZE_X = 17;
    const BOARD_SIZE_Y = 10;
    const TARGET_SUM = 10;
    const MAX_APPLE_VALUE = 9;
    const TIMER_DURATION = 120; // 2분
    const MATCHING_TIMEOUT = 15000; // 15초 매칭 타임아웃

    // 숫자별 사과 이미지 매핑
    const appleImages = {
        1: Apple1,
        2: Apple2,
        3: Apple3,
        4: Apple4,
        5: Apple5,
        6: Apple6,
        7: Apple7,
        8: Apple8,
        9: Apple9,
        default: AppleDefault
    };

    // 상태 관리
    const [gameState, setGameState] = useState('lobby'); // 'lobby', 'matching', 'playing', 'ended'
    const [playerName, setPlayerName] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [playerCount, setPlayerCount] = useState(0);
    const [gameBoard, setGameBoard] = useState([]);
    const [score, setScore] = useState(0);
    const [partnerScore, setPartnerScore] = useState(0);
    const [remainingTime, setRemainingTime] = useState(TIMER_DURATION);
    const [gameOver, setGameOver] = useState(false);
    const [selectedCells, setSelectedCells] = useState([]);
    const [partnerSelectedCells, setPartnerSelectedCells] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [otherPlayerName, setOtherPlayerName] = useState('');
    const [otherPlayerCursor, setOtherPlayerCursor] = useState({ x: 0, y: 0 });
    const [colorOption, setColorOption] = useState(false);
    const [bgmOption, setBgmOption] = useState(true);
    const [volume, setVolume] = useState(50);

    // refs
    const gameBoardRef = useRef(null);
    const timerRef = useRef(null);
    const playerId = useRef(Math.random().toString(36).substring(2, 15));
    const gameId = useRef(null);
    const otherPlayerId = useRef(null);
    const matchingTimer = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });
    const audioContext = useRef(null);
    const gameRef = useRef(null);
    const playersRef = useRef(null);

    // 랜덤 숫자 생성
    const getRandomAppleValue = () => Math.floor(Math.random() * MAX_APPLE_VALUE) + 1;

    // 오디오 컨텍스트 초기화
    const initAudioContext = useCallback(() => {
        try {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }, []);

    // 팝 사운드 생성
    const createPopSound = useCallback(() => {
        if (!audioContext.current) return;

        const oscillator = audioContext.current.createOscillator();
        const gainNode = audioContext.current.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.current.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.7 * (volume / 100), audioContext.current.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);

        oscillator.start();
        oscillator.stop(audioContext.current.currentTime + 0.1);
    }, [volume]);

    // 게임 보드 생성
    const generateBoard = useCallback(() => {
        const newBoard = [];
        for (let i = 0; i < BOARD_SIZE_Y; i++) {
            const row = [];
            for (let j = 0; j < BOARD_SIZE_X; j++) {
                row.push(getRandomAppleValue());
            }
            newBoard.push(row);
        }
        
        // 해결책 보장
        ensureSolution(newBoard);
        return newBoard;
    }, []);

    // 해결책 보장
    const ensureSolution = (board) => {
        if (!hasSolution(board)) {
            createSolution(board);
        }
    };

    // 해결책 존재 확인
    const hasSolution = (board) => {
        // 가로 검사
        for (let i = 0; i < BOARD_SIZE_Y; i++) {
            for (let j = 0; j < BOARD_SIZE_X - 1; j++) {
                if (board[i][j] + board[i][j + 1] === TARGET_SUM) return true;
                if (j < BOARD_SIZE_X - 2 && board[i][j] + board[i][j + 1] + board[i][j + 2] === TARGET_SUM) return true;
            }
        }

        // 세로 검사
        for (let j = 0; j < BOARD_SIZE_X; j++) {
            for (let i = 0; i < BOARD_SIZE_Y - 1; i++) {
                if (board[i][j] + board[i + 1][j] === TARGET_SUM) return true;
                if (i < BOARD_SIZE_Y - 2 && board[i][j] + board[i + 1][j] + board[i + 2][j] === TARGET_SUM) return true;
            }
        }

        // 직사각형 검사
        for (let width = 2; width <= 3; width++) {
            for (let height = 2; height <= 2; height++) {
                for (let i = 0; i <= BOARD_SIZE_Y - height; i++) {
                    for (let j = 0; j <= BOARD_SIZE_X - width; j++) {
                        let sum = 0;
                        for (let di = 0; di < height; di++) {
                            for (let dj = 0; dj < width; dj++) {
                                sum += board[i + di][j + dj];
                            }
                        }
                        if (sum === TARGET_SUM) return true;
                    }
                }
            }
        }

        return false;
    };

    // 해결책 생성
    const createSolution = (board) => {
        const startY = Math.floor(Math.random() * BOARD_SIZE_Y);
        const startX = Math.floor(Math.random() * (BOARD_SIZE_X - 2));
        const len = Math.random() < 0.5 ? 2 : 3;

        let remainingSum = TARGET_SUM;
        for (let i = 0; i < len - 1; i++) {
            const maxVal = Math.min(MAX_APPLE_VALUE, remainingSum - (len - 1 - i));
            const minVal = Math.max(1, remainingSum - (len - 1 - i) * MAX_APPLE_VALUE);
            const val = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
            board[startY][startX + i] = val;
            remainingSum -= val;
        }
        board[startY][startX + len - 1] = remainingSum;
    };    // 매칭 시작
    const startMatchmaking = async () => {
        if (!playerName.trim()) {
            alert('닉네임을 입력해주세요!');
            return;
        }

        if (!database) {
            alert('Firebase 연결에 문제가 있습니다. 나중에 다시 시도해주세요.');
            return;
        }

        setGameState('matching');
        setStatusMessage('상대방 찾는 중...');

        try {
            // 플레이어 등록
            await set(ref(database, `players/${playerId.current}`), {
                name: playerName,
                status: 'searching',
                timestamp: serverTimestamp()
            });

            // 연결 해제 시 플레이어 데이터 정리
            onDisconnect(ref(database, `players/${playerId.current}`)).remove();

            // 매칭 가능한 플레이어 찾기
            findMatchingPlayer();

            // 매칭 타임아웃 설정
            matchingTimer.current = setTimeout(() => {
                setStatusMessage('매칭 실패. 다시 시도해주세요.');
                setTimeout(() => {
                    resetToLobby();
                }, 2000);
            }, MATCHING_TIMEOUT);

        } catch (error) {
            console.error('매칭 시작 오류:', error);
            setStatusMessage('매칭 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };

    // 매칭 가능한 플레이어 찾기
    const findMatchingPlayer = () => {
        const playersRef = ref(database, 'players');
        
        onValue(playersRef, (snapshot) => {
            const players = snapshot.val();
            if (!players) return;

            // 자신을 제외한 매칭 중인 플레이어 찾기
            const otherPlayers = Object.entries(players).filter(([id, player]) => 
                id !== playerId.current && 
                player.status === 'searching'
            );

            if (otherPlayers.length > 0) {
                const [foundPlayerId, foundPlayer] = otherPlayers[0];
                createGame(foundPlayerId, foundPlayer.name);
                off(playersRef); // 리스너 제거
            }
        });
    };

    // 게임 생성
    const createGame = async (otherPlayer, otherName) => {
        clearTimeout(matchingTimer.current);
        
        otherPlayerId.current = otherPlayer;
        setOtherPlayerName(otherName);
        
        const newGameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        gameId.current = newGameId;
        setIsHost(true);

        try {
            // 게임 데이터 생성
            const newBoard = generateBoard();
            await set(ref(database, `games/${newGameId}`), {
                players: [playerId.current, otherPlayer],
                gameBoard: newBoard,
                scores: {
                    [playerId.current]: 0,
                    [otherPlayer]: 0
                },
                timer: TIMER_DURATION,
                status: 'playing',
                host: playerId.current,
                createdAt: serverTimestamp()
            });

            // 플레이어 상태 업데이트
            await set(ref(database, `players/${playerId.current}/status`), 'playing');
            await set(ref(database, `players/${otherPlayer}/status`), 'playing');

            // 게임 시작
            startMultiplayerGame(newBoard);

        } catch (error) {
            console.error('게임 생성 오류:', error);
            setStatusMessage('게임 생성 중 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };

    // 멀티플레이어 게임 시작
    const startMultiplayerGame = (board) => {
        setGameState('playing');
        setGameOver(false);
        setScore(0);
        setPartnerScore(0);
        setRemainingTime(TIMER_DURATION);
        setSelectedCells([]);
        setPartnerSelectedCells([]);
        setGameBoard(board);

        initAudioContext();
        startTimer();
        setupGameListeners();
    };

    // 게임 리스너 설정
    const setupGameListeners = () => {
        if (!gameId.current) return;

        gameRef.current = ref(database, `games/${gameId.current}`);
        
        // 게임 데이터 변경 리스너
        onValue(gameRef.current, (snapshot) => {
            const gameData = snapshot.val();
            if (!gameData) return;

            // 점수 동기화
            if (gameData.scores) {
                setScore(gameData.scores[playerId.current] || 0);
                setPartnerScore(gameData.scores[otherPlayerId.current] || 0);
            }

            // 보드 동기화
            if (gameData.gameBoard) {
                setGameBoard(gameData.gameBoard);
            }

            // 타이머 동기화
            if (typeof gameData.timer === 'number') {
                setRemainingTime(gameData.timer);
            }

            // 게임 상태 확인
            if (gameData.status === 'ended') {
                endGame();
            }
        });

        // 상대방 커서 리스너
        const cursorsRef = ref(database, `games/${gameId.current}/cursors/${otherPlayerId.current}`);
        onValue(cursorsRef, (snapshot) => {
            const cursorData = snapshot.val();
            if (cursorData) {
                setOtherPlayerCursor(cursorData);
            }
        });

        // 상대방 선택 리스너
        const selectionsRef = ref(database, `games/${gameId.current}/selections/${otherPlayerId.current}`);
        onValue(selectionsRef, (snapshot) => {
            const selectionData = snapshot.val();
            if (selectionData) {
                setPartnerSelectedCells(selectionData);
            }
        });
    };

    // 타이머 시작
    const startTimer = () => {
        timerRef.current = setInterval(async () => {
            setRemainingTime(prev => {
                const newTime = prev - 1;
                
                // 호스트만 타이머 업데이트
                if (isHost && gameId.current) {
                    set(ref(database, `games/${gameId.current}/timer`), newTime);
                }
                
                if (newTime <= 0) {
                    endGame();
                    return 0;
                }
                return newTime;
            });
        }, 1000);
    };

    // 게임 종료
    const endGame = async () => {
        clearInterval(timerRef.current);
        setGameOver(true);
        setGameState('ended');

        // 호스트만 게임 상태 업데이트
        if (isHost && gameId.current) {
            try {
                await set(ref(database, `games/${gameId.current}/status`), 'ended');
            } catch (error) {
                console.error('게임 종료 업데이트 오류:', error);
            }
        }

        alert(`게임 종료!\n내 점수: ${score}\n파트너 점수: ${partnerScore}\n총 점수: ${score + partnerScore}`);
    };

    // 로비로 돌아가기
    const resetToLobby = async () => {
        setGameState('lobby');
        setPlayerName('');
        setStatusMessage('');
        setScore(0);
        setPartnerScore(0);
        setRemainingTime(TIMER_DURATION);
        setGameOver(false);
        setSelectedCells([]);
        setPartnerSelectedCells([]);
        setGameBoard([]);
        clearInterval(timerRef.current);
        clearTimeout(matchingTimer.current);

        // Firebase 리스너 정리
        if (gameRef.current) {
            off(gameRef.current);
        }
        if (playersRef.current) {
            off(playersRef.current);
        }

        // 플레이어 데이터 정리
        try {
            await remove(ref(database, `players/${playerId.current}`));
            if (gameId.current) {
                await remove(ref(database, `games/${gameId.current}`));
            }
        } catch (error) {
            console.error('데이터 정리 오류:', error);
        }

        // refs 초기화
        gameId.current = null;
        otherPlayerId.current = null;
        playerId.current = Math.random().toString(36).substring(2, 15);
    };

    // 마우스 이벤트 핸들러
    const handleMouseDown = (e) => {
        if (gameOver || gameState !== 'playing') return;

        const rect = gameBoardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        startPos.current = { x, y };
        setIsSelecting(true);
        setSelectionBox({
            left: x,
            top: y,
            width: 0,
            height: 0
        });

        // 커서 위치 전송
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/cursors/${playerId.current}`), {
                x: e.clientX,
                y: e.clientY
            });
        }
    };

    const handleMouseMove = (e) => {
        if (!isSelecting || gameOver || gameState !== 'playing') return;

        const rect = gameBoardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const left = Math.min(startPos.current.x, x);
        const top = Math.min(startPos.current.y, y);
        const width = Math.abs(x - startPos.current.x);
        const height = Math.abs(y - startPos.current.y);

        setSelectionBox({ left, top, width, height });
        updateSelectedCells(left, top, width, height);

        // 커서 위치 전송
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/cursors/${playerId.current}`), {
                x: e.clientX,
                y: e.clientY
            });
        }
    };

    const handleMouseUp = () => {
        if (!isSelecting) return;

        setIsSelecting(false);
        checkSelection();
        setSelectionBox(null);

        // 선택 영역 전송
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/selections/${playerId.current}`), selectedCells);
        }
    };

    // 선택된 셀 업데이트
    const updateSelectedCells = (left, top, width, height) => {
        const cells = [];
        const cellWidth = gameBoardRef.current.offsetWidth / BOARD_SIZE_X;
        const cellHeight = gameBoardRef.current.offsetHeight / BOARD_SIZE_Y;

        const startCol = Math.floor(left / cellWidth);
        const endCol = Math.floor((left + width) / cellWidth);
        const startRow = Math.floor(top / cellHeight);
        const endRow = Math.floor((top + height) / cellHeight);

        for (let row = Math.max(0, startRow); row <= Math.min(BOARD_SIZE_Y - 1, endRow); row++) {
            for (let col = Math.max(0, startCol); col <= Math.min(BOARD_SIZE_X - 1, endCol); col++) {
                if (gameBoard[row] && gameBoard[row][col] !== 0) {
                    cells.push({ row, col });
                }
            }
        }

        setSelectedCells(cells);
    };

    // 선택 확인
    const checkSelection = async () => {
        if (selectedCells.length === 0) return;

        const sum = selectedCells.reduce((total, { row, col }) => total + gameBoard[row][col], 0);

        if (sum === TARGET_SUM) {
            // 성공 처리
            createPopSound();
            const newScore = score + selectedCells.length;
            setScore(newScore);

            // 보드 업데이트
            const newBoard = [...gameBoard];
            selectedCells.forEach(({ row, col }) => {
                newBoard[row][col] = 0;
            });
            setGameBoard(newBoard);

            // Firebase에 업데이트
            if (gameId.current) {
                try {
                    await set(ref(database, `games/${gameId.current}/gameBoard`), newBoard);
                    await set(ref(database, `games/${gameId.current}/scores/${playerId.current}`), newScore);
                } catch (error) {
                    console.error('게임 데이터 업데이트 오류:', error);
                }
            }

            // 해결책이 없으면 게임 종료
            if (!hasSolution(newBoard)) {
                setTimeout(endGame, 500);
            }
        }

        setSelectedCells([]);
    };

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(matchingTimer.current);
            
            // Firebase 리스너 정리
            if (gameRef.current) {
                off(gameRef.current);
            }
            if (playersRef.current) {
                off(playersRef.current);
            }
        };
    }, []);

    // 시간 포맷팅
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 로비 화면 렌더링
    const renderLobby = () => (
        <div className="lobby-container">
            <div className="lobby-content">
                <h1>사과 상자 게임 - 협동모드</h1>
                <div className="nickname-form">
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                        maxLength="10"
                        onKeyDown={(e) => e.key === 'Enter' && startMatchmaking()}
                    />
                    <button onClick={startMatchmaking} disabled={gameState === 'matching'}>
                        게임 시작
                    </button>
                </div>
                <div className="status-message">{statusMessage}</div>
                <div className="player-count">접속자 수: {playerCount}명</div>
            </div>
        </div>
    );

    // 게임 화면 렌더링
    const renderGame = () => (
        <div className="game-container">
            <div className="header">
                <h1>사과 상자 게임 - 협동모드</h1>
                <div className="score-container">
                    <span>{score + partnerScore}</span>
                </div>
                <div className="players-info">
                    <div className="player player1">
                        <span className="player-color">●</span>
                        <span className="player-name">{playerName} ({score})</span>
                    </div>
                    <div className="player player2">
                        <span className="player-color">●</span>
                        <span className="player-name">{otherPlayerName} ({partnerScore})</span>
                    </div>
                </div>
            </div>

            <div className="game-area">
                <div 
                    className="game-board"
                    ref={gameBoardRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => setIsSelecting(false)}
                >
                    {gameBoard.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`cell ${cell === 0 ? 'empty' : 'apple'} ${
                                    selectedCells.some(({ row, col }) => row === rowIndex && col === colIndex) ? 'selected' : ''
                                } ${
                                    partnerSelectedCells.some(({ row, col }) => row === rowIndex && col === colIndex) ? 'partner-selected' : ''
                                }`}
                            >
                                {cell > 0 && (
                                    <img
                                        src={appleImages[cell] || appleImages.default}
                                        alt={`Apple ${cell}`}
                                        className="apple-image"
                                        draggable={false}
                                    />
                                )}
                                <span className="cell-number">{cell || ''}</span>
                            </div>
                        ))
                    )}
                    
                    {selectionBox && (
                        <div 
                            className="selection-box player1"
                            style={{
                                left: selectionBox.left,
                                top: selectionBox.top,
                                width: selectionBox.width,
                                height: selectionBox.height
                            }}
                        />
                    )}
                </div>

                <div className="timer-container">
                    <div 
                        className="timer-bar"
                        style={{ height: `${(remainingTime / TIMER_DURATION) * 100}%` }}
                    />
                </div>
            </div>

            <div className="controls">
                <button onClick={onBack}>뒤로가기</button>
                <button onClick={resetToLobby}>다시하기</button>
                <div className="options">
                    <label className="option-label">
                        <input
                            type="checkbox"
                            checked={colorOption}
                            onChange={(e) => setColorOption(e.target.checked)}
                        />
                        옅은색
                    </label>
                    <label className="option-label">
                        <input
                            type="checkbox"
                            checked={bgmOption}
                            onChange={(e) => setBgmOption(e.target.checked)}
                        />
                        BGM
                    </label>
                </div>
                <div className="volume-control">
                    <button>🔊</button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );

    // 상대방 커서 렌더링
    const renderOtherPlayerCursor = () => (
        <div 
            className="player-cursor player2"
            style={{
                left: otherPlayerCursor.x,
                top: otherPlayerCursor.y,
                display: gameState === 'playing' ? 'block' : 'none'
            }}
        >
            <span className="player-name">{otherPlayerName}</span>
        </div>
    );    return (
        <div className={`partner-mode ${colorOption ? 'light-mode' : ''}`}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'red', color: 'white', padding: '5px', zIndex: 9999 }}>
                PartnerMode Loaded - State: {gameState}
            </div>
            {gameState === 'lobby' || gameState === 'matching' ? renderLobby() : renderGame()}
            {gameState === 'playing' && renderOtherPlayerCursor()}
        </div>
    );
};

export default PartnerMode;
