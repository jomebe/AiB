import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, remove, onDisconnect, serverTimestamp, off, get } from 'firebase/database';
import '../styles/ClassicMode.css';
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
import AuthService from '../../utils/auth';
import Rankings from '../Rankings/Rankings';
import Login from '../Login/Login';

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
    
    // 게임 설정 - ClassicMode와 동일하게
    const BOARD_SIZE_X = 15; // 가로 칸 수 (ClassicMode와 동일)
    const BOARD_SIZE_Y = 10; // 세로 칸 수 (ClassicMode와 동일)
    const TARGET_SUM = 10;
    const MAX_APPLE_VALUE = 9;
    const TIMER_DURATION = 60; // 1분
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
    const [gameBoard, setGameBoard] = useState([]);
    const [score, setScore] = useState(0);
    const [partnerScore, setPartnerScore] = useState(0);
    const [remainingTime, setRemainingTime] = useState(TIMER_DURATION);
    const [gameOver, setGameOver] = useState(false);
    const [selectedCells, setSelectedCells] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [otherPlayerSelecting, setOtherPlayerSelecting] = useState(false); // 상대방의 선택 상태 추적
    const [isHost, setIsHost] = useState(false);
    const [otherPlayerName, setOtherPlayerName] = useState('');
    const [otherPlayerCursor, setOtherPlayerCursor] = useState({ x: 0, y: 0 });
    const [currentUser, setCurrentUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRankings, setShowRankings] = useState(false);
    
    // refs - ClassicMode와 동일한 구조
    const gameBoardRef = useRef(null);
    const timerRef = useRef(null);
    const selectionBoxRef = useRef(null);
    const mouseIsDownRef = useRef(false); // 마우스 버튼 상태를 추적하는 ref
    const playerId = useRef(Math.random().toString(36).substring(2, 15));
    const gameId = useRef(null);
    const otherPlayerId = useRef(null);
    const matchingTimer = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });
    const audioContext = useRef(null);
    const gameRef = useRef(null);
    const playersRef = useRef(null);

    // 랜덤 숫자 생성
    const getRandomAppleValue = () => Math.floor(Math.random() * MAX_APPLE_VALUE) + 1;    // 로비 화면 렌더링
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
                <div className="status-message">
                    {statusMessage || 'Firebase 연결된 실시간 협동 모드 - 튕김 현상 해결됨!'}
                </div>
                <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px' }}>
                    뒤로가기
                </button>
            </div>
        </div>
    );

    // 게임 화면 렌더링
    const renderGame = () => (
        <div className="game-container">
            <div className="header">
                <h1>사과 상자 게임 - 협동모드</h1>
            </div>

            <div className="game-area">
                <div className="timer-score-sidebar">
                    <div className="timer-display">
                        <span className="timer-value">{formatTime(remainingTime)}</span>
                    </div>
                    
                    <div className="score-display">
                        <div className="total-score">
                            <span className="score-label">총 점수</span>
                            <span className="score-value">{(score || 0) + (partnerScore || 0)}</span>
                        </div>
                        <div className="individual-scores">
                            <div className="player-score player1-score">
                                <div className="player-info">
                                    <span className="player-color player1-color">●</span>
                                    <span className="player-name">{playerName || '플레이어1'}</span>
                                </div>
                                <span className="score-value">{score || 0}</span>
                            </div>
                            <div className="player-score player2-score">
                                <div className="player-info">
                                    <span className="player-color player2-color">●</span>
                                    <span className="player-name">{otherPlayerName || '플레이어2'}</span>
                                </div>
                                <span className="score-value">{partnerScore || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="game-board"
                    ref={gameBoardRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onDragStart={preventDrag}
                    onContextMenu={preventContextMenu}
                >
                    {Array.from({ length: BOARD_SIZE_Y }).map((_, rowIndex) => (
                        Array.from({ length: BOARD_SIZE_X }).map((_, colIndex) => {
                            const cell = gameBoard[rowIndex] && gameBoard[rowIndex][colIndex];
                            if (!cell) return null;
                            
                            return (
                                <div 
                                    key={`${rowIndex}-${colIndex}`} 
                                    className={`board-cell ${cell.isVisible ? 'apple-cell' : 'empty-cell'}`}
                                    data-row={rowIndex}
                                    data-col={colIndex}
                                    data-value={cell.value}
                                    style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 1 }}
                                    draggable="false"
                                    onContextMenu={preventContextMenu}
                                    onDragStart={preventDrag}
                                    onSelectStart={preventDrag}
                                >
                                    {cell.isVisible && (
                                        <img 
                                            src={appleImages[cell.value] || appleImages.default} 
                                            alt={`Apple ${cell.value}`} 
                                            className="apple-image" 
                                            draggable="false"
                                            onDragStart={preventDrag}
                                            onContextMenu={preventContextMenu}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    )}
                                </div>
                            );
                        })
                    )).flat()}
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
    );

    // 랭킹 핸들러
    const handleRankingClick = () => {
        setShowRankings(true);
    };

    const handleCloseRanking = () => {
        setShowRankings(false);
    };

    // 로그인 성공 처리
    const handleLoginSuccess = (user) => {
        setCurrentUser(user);
        setShowLogin(false);
        console.log('로그인 성공:', user);
    };

    // 로그인 모달 닫기
    const handleLoginClose = () => {
        setShowLogin(false);
        setCurrentUser(AuthService.getCurrentUser());
    };

    // 게임 보드 생성 - ClassicMode와 동일
    const generateBoard = () => {
        const board = [];
        for (let row = 0; row < BOARD_SIZE_Y; row++) {
            const currentRow = [];
            for (let col = 0; col < BOARD_SIZE_X; col++) {
                currentRow.push({
                    value: getRandomAppleValue(),
                    isVisible: true
                });
            }
            board.push(currentRow);
        }
        return board;
    };

    // 해결 가능한 조합이 있는지 확인
    const hasSolution = (board) => {
        for (let row = 0; row < BOARD_SIZE_Y; row++) {
            for (let col = 0; col < BOARD_SIZE_X; col++) {
                if (!board[row][col].isVisible) continue;
                
                const visited = new Set();
                if (findSolution(board, row, col, 0, visited)) {
                    return true;
                }
            }
        }
        return false;
    };

    const findSolution = (board, row, col, currentSum, visited) => {
        if (row < 0 || row >= BOARD_SIZE_Y || col < 0 || col >= BOARD_SIZE_X) return false;
        if (!board[row][col].isVisible) return false;
        
        const key = `${row}-${col}`;
        if (visited.has(key)) return false;
        
        const newSum = currentSum + board[row][col].value;
        if (newSum > TARGET_SUM) return false;
        if (newSum === TARGET_SUM && visited.size >= 1) return true;
        
        visited.add(key);
        
        const directions = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];
        for (const [dr, dc] of directions) {
            if (findSolution(board, row + dr, col + dc, newSum, visited)) {
                visited.delete(key);
                return true;
            }
        }
        
        visited.delete(key);
        return false;
    };

    // 오디오 컨텍스트 초기화
    const initAudioContext = () => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    };

    // 팝 사운드 생성
    const createPopSound = () => {
        if (!audioContext.current) return;
        
        const oscillator = audioContext.current.createOscillator();
        const gainNode = audioContext.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.current.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
        
        oscillator.start(audioContext.current.currentTime);
        oscillator.stop(audioContext.current.currentTime + 0.1);
    };

    // 드래그 방지
    const preventDrag = (e) => {
        e.preventDefault();
        return false;
    };

    // 우클릭 방지
    const preventContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    // Firebase 데이터 정리
    const clearFirebaseData = async () => {
        try {
            // 기존 플레이어 데이터 정리
            const playersRef = ref(database, 'players');
            const playersSnapshot = await get(playersRef);
            
            if (playersSnapshot.exists()) {
                const players = playersSnapshot.val();
                const currentTime = Date.now();
                
                // 5분 이상 된 플레이어 데이터 정리
                for (const [id, player] of Object.entries(players)) {
                    if (currentTime - (player.lastActive || 0) > 300000) {
                        await remove(ref(database, `players/${id}`));
                    }
                }
            }
        } catch (error) {
            console.error('Firebase 데이터 정리 오류:', error);
        }
    };

    // 매칭 시작
    const startMatchmaking = async () => {
        if (!playerName.trim()) {
            alert('닉네임을 입력해주세요.');
            return;
        }

        setGameState('matching');
        setStatusMessage('다른 플레이어를 찾는 중...');

        try {
            // 플레이어 등록
            await set(ref(database, `players/${playerId.current}`), {
                name: playerName,
                status: 'searching',
                lastActive: serverTimestamp()
            });

            // 연결 해제 시 자동 정리
            onDisconnect(ref(database, `players/${playerId.current}`)).remove();

            // 매칭 타임아웃 설정
            matchingTimer.current = setTimeout(() => {
                setStatusMessage('매칭 시간이 초과되었습니다. 다시 시도해주세요.');
                setTimeout(resetToLobby, 2000);
            }, MATCHING_TIMEOUT);

            // 매칭 시작
            findMatch();

        } catch (error) {
            console.error('매칭 시작 오류:', error);
            setStatusMessage('매칭 시작 중 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };

    // 매칭 찾기
    const findMatch = () => {
        let isMatched = false;
        let gamesListener, playersListener;

        const gamesRef = ref(database, 'games');
        playersRef.current = ref(database, 'players');

        const cleanupListeners = () => {
            if (gamesListener) off(gamesRef, gamesListener);
            if (playersListener) off(playersRef.current, playersListener);
        };

        // 먼저 기존 게임에 참가할 수 있는지 확인
        gamesListener = onValue(gamesRef, (snapshot) => {
            if (isMatched) return;

            const games = snapshot.val();
            if (games) {
                const waitingGames = Object.entries(games).filter(([gameId, game]) => 
                    game.status === 'waiting' &&
                    game.players.length === 1 &&
                    !game.players.includes(playerId.current)
                );

                if (waitingGames.length > 0) {
                    isMatched = true;
                    const [gameIdStr, gameData] = waitingGames[0];
                    cleanupListeners();
                    joinExistingGame(gameIdStr, gameData);
                    return;
                }
            }

            // 기존 게임이 없으면 다른 플레이어 찾기
            if (!playersListener) {
                playersListener = onValue(playersRef.current, (snapshot) => {
                    if (isMatched) return;

                    const players = snapshot.val();
                    if (!players) return;

                    const otherPlayers = Object.entries(players).filter(([id, player]) =>
                        id !== playerId.current &&
                        player.status === 'searching'
                    );

                    if (otherPlayers.length > 0) {
                        isMatched = true;
                        const [foundPlayerId, foundPlayer] = otherPlayers[0];
                        cleanupListeners();
                        createGame(foundPlayerId, foundPlayer.name);
                    }
                });
            }
        });
    };

    // 게임 생성
    const createGame = async (otherPlayer, otherName) => {
        if (gameId.current) {
            console.log('Game already being created, skipping...');
            return;
        }

        clearTimeout(matchingTimer.current);
        otherPlayerId.current = otherPlayer;
        setOtherPlayerName(otherName);

        const newGameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        gameId.current = newGameId;
        setIsHost(true);

        try {
            await set(ref(database, `players/${otherPlayer}/status`), 'playing');
            await set(ref(database, `players/${playerId.current}/status`), 'playing');

            const newBoard = generateBoard();
            await set(ref(database, `games/${newGameId}`), {
                players: [playerId.current],
                gameBoard: newBoard,
                scores: {
                    [playerId.current]: 0
                },
                timer: TIMER_DURATION,
                status: 'waiting',
                host: playerId.current,
                createdAt: serverTimestamp()
            });

            const gameRef = ref(database, `games/${newGameId}`);
            const unsubscribe = onValue(gameRef, (snapshot) => {
                const gameData = snapshot.val();
                if (gameData && gameData.players.length === 2 && gameData.status === 'playing') {
                    unsubscribe();
                    startMultiplayerGame(newBoard);
                }
            });

            await set(ref(database, `players/${playerId.current}/status`), 'playing');

        } catch (error) {
            console.error('게임 생성 오류:', error);
            setStatusMessage('게임 생성 중 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };

    // 기존 게임에 참가
    const joinExistingGame = async (existingGameId, gameData) => {
        try {
            clearTimeout(matchingTimer.current);
            gameId.current = existingGameId;
            setIsHost(false);

            const hostId = gameData.players[0];
            otherPlayerId.current = hostId;

            const hostSnapshot = await get(ref(database, `players/${hostId}`));
            if (hostSnapshot.exists()) {
                setOtherPlayerName(hostSnapshot.val().name);
            }

            await set(ref(database, `games/${existingGameId}/players`), [...gameData.players, playerId.current]);
            await set(ref(database, `games/${existingGameId}/status`), 'playing');
            await set(ref(database, `games/${existingGameId}/scores/${playerId.current}`), 0);
            await set(ref(database, `players/${playerId.current}/status`), 'playing');

            startMultiplayerGame(gameData.gameBoard);

        } catch (error) {
            console.error('게임 참가 오류:', error);
            setStatusMessage('게임 참가 중 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };    // 멀티플레이어 게임 시작
    const startMultiplayerGame = (board) => {
        console.log('Starting multiplayer game - isHost:', isHost, 'board size:', board.length);
        setGameState('playing');
        setGameOver(false);
        setScore(0);
        setPartnerScore(0);
        setRemainingTime(TIMER_DURATION);

        setSelectedCells([]);
        setGameBoard(board);
        initAudioContext();
        
        // 리스너를 먼저 설정하고 그 다음에 타이머 시작
        setupGameListeners();
        
        // 호스트만 타이머 시작
        if (isHost) {
            console.log('Host starting timer...');
            setTimeout(() => startTimer(), 500); // 약간의 지연으로 모든 플레이어가 준비되도록
        } else {
            console.log('Non-host waiting for timer updates from Firebase');
        }
    };

    // 게임 리스너 설정
    const setupGameListeners = () => {
        if (!gameId.current) return;

        gameRef.current = ref(database, `games/${gameId.current}`);
        
        onValue(gameRef.current, (snapshot) => {
            const gameData = snapshot.val();
            if (!gameData) {
                console.log('Game deleted, returning to lobby');
                resetToLobby();
                return;
            }

            if (gameData.players && gameData.players.length < 2) {
                alert('상대방이 게임을 나갔습니다. 로비로 돌아갑니다.');
                setTimeout(() => resetToLobby(), 2000);
                return;
            }            // 점수 동기화
            if (gameData.scores) {
                console.log('Syncing scores:', gameData.scores);
                console.log('My player ID:', playerId.current);
                console.log('Other player ID:', otherPlayerId.current);
                
                const myScore = gameData.scores[playerId.current] || 0;
                setScore(myScore);
                
                // 상대방 점수 찾기 - otherPlayerId가 없으면 다른 플레이어 찾기
                if (otherPlayerId.current && gameData.scores[otherPlayerId.current] !== undefined) {
                    setPartnerScore(gameData.scores[otherPlayerId.current] || 0);
                } else {
                    // 다른 플레이어 ID 찾기
                    const otherPlayerScore = Object.entries(gameData.scores).find(([id]) => id !== playerId.current);
                    if (otherPlayerScore) {
                        setPartnerScore(otherPlayerScore[1] || 0);
                        if (!otherPlayerId.current) {
                            otherPlayerId.current = otherPlayerScore[0];
                            console.log('Found other player ID:', otherPlayerScore[0]);
                        }
                    }
                }
            }            // 보드 동기화 - 간소화된 로직
            if (gameData.gameBoard) {
                const currentlyInteracting = isSelecting || mouseIsDownRef.current;
                const otherCurrentlyInteracting = otherPlayerSelecting;
                
                // 아무도 상호작용하지 않을 때만 보드 업데이트
                if (!currentlyInteracting && !otherCurrentlyInteracting) {
                    const currentBoardString = JSON.stringify(gameBoard);
                    const newBoardString = JSON.stringify(gameData.gameBoard);
                    
                    if (currentBoardString !== newBoardString) {
                        console.log('Applying board update from Firebase');
                        setGameBoard(gameData.gameBoard);
                    }
                } else {
                    console.log('Board update delayed - someone interacting (me:', currentlyInteracting, ', other:', otherCurrentlyInteracting, ')');
                }
            }            // 타이머 동기화 (호스트가 아닌 경우만)
            if (typeof gameData.timer === 'number' && !isHost) {
                console.log('Non-host receiving timer update from Firebase:', gameData.timer);
                setRemainingTime(gameData.timer);
                
                // 타이머가 0이 되면 게임 종료
                if (gameData.timer <= 0 && !gameOver) {
                    console.log('Timer reached 0 via Firebase sync, ending game...');
                    setTimeout(() => endGame(), 100);
                }
            }

            // 게임 상태 확인
            if (gameData.status === 'ended' && !gameOver) {
                console.log('Game ended via Firebase sync');
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
        });        // 상대방 선택 상태 리스너
        const otherSelectingRef = ref(database, `games/${gameId.current}/selectingState/${otherPlayerId.current}`);
        onValue(otherSelectingRef, (snapshot) => {
            const isOtherSelecting = snapshot.val();
            if (typeof isOtherSelecting === 'boolean') {
                setOtherPlayerSelecting(isOtherSelecting);
                console.log('Other player selecting state updated:', isOtherSelecting);
            }
        });
    };    // 타이머 시작 - 호스트만 실행
    const startTimer = () => {
        console.log('startTimer called - isHost:', isHost, 'gameId:', gameId.current);
        
        if (isHost && gameId.current) {
            console.log('Host starting timer...');
            // 먼저 Firebase에 초기 타이머 값 설정
            set(ref(database, `games/${gameId.current}/timer`), TIMER_DURATION).catch(console.error);
            
            timerRef.current = setInterval(async () => {
                setRemainingTime(prev => {
                    const newTime = Math.max(0, prev - 1);
                    console.log('Host timer update:', newTime);

                    // Firebase에 타이머 업데이트 (즉시)
                    if (gameId.current) {
                        set(ref(database, `games/${gameId.current}/timer`), newTime).catch(console.error);
                    }

                    if (newTime <= 0) {
                        setTimeout(() => endGame(), 100); // 약간의 지연으로 모든 플레이어가 동기화되도록
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            console.log('Non-host player, waiting for timer updates from Firebase...');
        }
    };    // 게임 종료
    const endGame = async () => {
        if (gameOver) return;
        
        console.log('Game ending...');
        setGameOver(true);
        setGameState('ended');

        // 타이머 정리
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // 호스트가 Firebase 상태 업데이트
        if (isHost && gameId.current) {
            try {
                await Promise.all([
                    set(ref(database, `games/${gameId.current}/status`), 'ended'),
                    set(ref(database, `games/${gameId.current}/timer`), 0)
                ]);
                console.log('Game status updated to ended in Firebase');
            } catch (error) {
                console.error('게임 종료 업데이트 오류:', error);
            }
        }

        // 결과 표시
        setTimeout(() => {
            alert(`게임 종료!\n내 점수: ${score}\n파트너 점수: ${partnerScore}\n총 점수: ${score + partnerScore}`);
        }, 100);
    };    // 로비로 돌아가기
    const resetToLobby = async () => {
        console.log('Resetting to lobby...');
        
        // 상태 초기화
        setGameState('lobby');
        setPlayerName('');
        setStatusMessage('');
        setScore(0);
        setPartnerScore(0);
        setRemainingTime(TIMER_DURATION);
        setGameOver(false);
        setSelectedCells([]);
        setGameBoard([]);
        setIsSelecting(false);
        setOtherPlayerSelecting(false);
        setOtherPlayerName('');

        // 타이머 및 인터벌 정리
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        clearTimeout(matchingTimer.current);

        // Firebase 리스너 정리
        if (gameRef.current) {
            off(gameRef.current);
            gameRef.current = null;
        }
        if (playersRef.current) {
            off(playersRef.current);
            playersRef.current = null;
        }

        // Firebase 데이터 정리
        try {
            if (gameId.current) {
                await removePlayerFromGame(playerId.current);
            }
            await remove(ref(database, `players/${playerId.current}`));
        } catch (error) {
            console.error('데이터 정리 오류:', error);
        }

        // refs 초기화
        gameId.current = null;
        otherPlayerId.current = null;
        playerId.current = Math.random().toString(36).substring(2, 15);
        
        console.log('Reset to lobby completed');
    };

    // 게임에서 플레이어 제거
    const removePlayerFromGame = async (playerIdToRemove) => {
        if (!gameId.current) return;

        try {
            const gameRef = ref(database, `games/${gameId.current}`);
            const gameSnapshot = await get(gameRef);

            if (!gameSnapshot.exists()) return;

            const gameData = gameSnapshot.val();
            const players = gameData.players || [];
            const updatedPlayers = players.filter(id => id !== playerIdToRemove);

            if (updatedPlayers.length === 0) {
                await remove(gameRef);
            } else {
                await set(ref(database, `games/${gameId.current}/players`), updatedPlayers);
                if (gameData.scores && gameData.scores[playerIdToRemove]) {
                    await remove(ref(database, `games/${gameId.current}/scores/${playerIdToRemove}`));
                }
                await remove(ref(database, `games/${gameId.current}/selections/${playerIdToRemove}`));
                await remove(ref(database, `games/${gameId.current}/cursors/${playerIdToRemove}`));
            }
        } catch (error) {
            console.error('게임에서 플레이어 제거 오류:', error);
        }
    };

    // 전역 마우스 업 이벤트 핸들러
    const handleGlobalMouseUp = useCallback((e) => {
        const wasDown = mouseIsDownRef.current;
        
        if (isSelecting && wasDown) {
            handleMouseUp(e);
        }
        
        mouseIsDownRef.current = false;
        
        // 안전 장치로 Firebase에 선택 종료 상태 전송
        if (gameId.current && wasDown && isSelecting) {
            set(ref(database, `games/${gameId.current}/selectingState/${playerId.current}`), false).catch(console.error);
        }
    }, [isSelecting]);

    // 선택 상자 생성
    const createSelectionBox = (x, y) => {
        const selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box';
        selectionBox.style.left = `${x}px`;
        selectionBox.style.top = `${y}px`;
        selectionBox.style.width = '0';
        selectionBox.style.height = '0';
        
        gameBoardRef.current.appendChild(selectionBox);
        selectionBoxRef.current = selectionBox;
    };
    
    // 선택 상자 업데이트
    const updateSelectionBox = (x, y) => {
        if (!selectionBoxRef.current) return;
        
        const { x: startX, y: startY } = startPos.current;
        const width = Math.abs(x - startX);
        const height = Math.abs(y - startY);
        
        const left = Math.min(startX, x);
        const top = Math.min(startY, y);
        
        selectionBoxRef.current.style.left = `${left}px`;
        selectionBoxRef.current.style.top = `${top}px`;
        selectionBoxRef.current.style.width = `${width}px`;
        selectionBoxRef.current.style.height = `${height}px`;
    };

    // 선택된 셀 업데이트
    const updateSelectedCells = () => {
        if (!selectionBoxRef.current) return;
        
        const selectionRect = selectionBoxRef.current.getBoundingClientRect();
        const cells = document.querySelectorAll('.apple-cell');
        const selectedCellsData = [];
        
        cells.forEach(cell => {
            cell.classList.remove('selected');
            
            if (!cell.dataset.value) return;
            
            const cellRect = cell.getBoundingClientRect();
            const cellCenterX = cellRect.left + cellRect.width / 2;
            const cellCenterY = cellRect.top + cellRect.height / 2;
            
            if (
                cellCenterX >= selectionRect.left &&
                cellCenterX <= selectionRect.right &&
                cellCenterY >= selectionRect.top &&
                cellCenterY <= selectionRect.bottom
            ) {
                cell.classList.add('selected');
                
                selectedCellsData.push({
                    row: parseInt(cell.dataset.row),
                    col: parseInt(cell.dataset.col),
                    value: parseInt(cell.dataset.value)
                });
            }
        });
        
        setSelectedCells(selectedCellsData);
    };

    // 선택 상태 정리
    const cleanupSelection = () => {
        console.log('Cleaning up selection state');
        
        document.querySelectorAll('.apple-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        if (selectionBoxRef.current) {
            selectionBoxRef.current.remove();
            selectionBoxRef.current = null;
        }
        
        setIsSelecting(false);
        setSelectedCells([]);
        
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/selectingState/${playerId.current}`), false).catch(console.error);
        }
    };    // 마우스 이벤트 핸들러들
    const handleMouseDown = (e) => {
        if (e.button === 2) return;
        if (gameOver || gameState !== 'playing') return;
        
        console.log('Mouse down started');
        
        mouseIsDownRef.current = true;
        setIsSelecting(true);
        
        // Firebase에 선택 시작 상태를 즉시 전송
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/selectingState/${playerId.current}`), true).catch(console.error);
        }
        
        const boardRect = gameBoardRef.current.getBoundingClientRect();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        
        setSelectedCells([]);
        startPos.current = { x, y };

        createSelectionBox(x, y);

        // 커서 위치 업데이트
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/cursors/${playerId.current}`), {
                x: e.clientX,
                y: e.clientY
            }).catch(console.error);
        }
    };

    const handleMouseMove = (e) => {
        if (!isSelecting || !mouseIsDownRef.current) return;
        
        const boardRect = gameBoardRef.current.getBoundingClientRect();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        
        updateSelectionBox(x, y);
        updateSelectedCells();
        
        e.preventDefault();
        e.stopPropagation();

        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/cursors/${playerId.current}`), {
                x: e.clientX,
                y: e.clientY
            }).catch(console.error);
        }
    };    const handleMouseUp = (e) => {
        if (!isSelecting) return;
        
        console.log('Mouse up started');
        
        mouseIsDownRef.current = false;
        
        // 선택 확인을 먼저 실행
        checkSelection();
        
        // Firebase에 선택 종료 상태 전송
        if (gameId.current) {
            Promise.all([
                set(ref(database, `games/${gameId.current}/selectingState/${playerId.current}`), false),
                set(ref(database, `games/${gameId.current}/selections/${playerId.current}`), selectedCells)
            ]).catch(console.error);
        }
        
        // 선택 상태 정리
        cleanupSelection();
        
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleMouseLeave = (e) => {
        if (isSelecting) {
            handleMouseUp(e);
        }
    };    // 선택 확인 - 간소화된 버전
    const checkSelection = async () => {
        if (selectedCells.length < 2) return;

        const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
        console.log('선택된 셀:', selectedCells, '합계:', sum);

        if (sum === TARGET_SUM) {
            createPopSound();
            const newScore = score + selectedCells.length;
            setScore(newScore);

            // 로컬 보드 즉시 업데이트
            const newBoard = gameBoard.map(row => [...row]);
            selectedCells.forEach(({ row, col }) => {
                newBoard[row][col].isVisible = false;
            });
            setGameBoard(newBoard);

            // 애니메이션 효과
            selectedCells.forEach(cell => {
                const cellElement = document.querySelector(`.board-cell[data-row="${cell.row}"][data-col="${cell.col}"] .apple-image`);
                if (cellElement) {
                    cellElement.classList.add('apple-explode');
                }
            });

            // Firebase 업데이트 - 즉시 업데이트
            if (gameId.current) {
                try {
                    console.log('Updating Firebase - Board and Score');
                    await Promise.all([
                        set(ref(database, `games/${gameId.current}/gameBoard`), newBoard),
                        set(ref(database, `games/${gameId.current}/scores/${playerId.current}`), newScore)
                    ]);
                    
                    console.log('Firebase updated successfully:', { 
                        playerId: playerId.current, 
                        newScore, 
                        gameId: gameId.current 
                    });
                    
                    // 해결책이 없으면 게임 종료
                    if (!hasSolution(newBoard)) {
                        setTimeout(endGame, 500);
                    }
                } catch (error) {
                    console.error('게임 데이터 업데이트 오류:', error);
                }
            }
        }

        setSelectedCells([]);
    };

    // useEffect로 컴포넌트 생명주기 관리
    useEffect(() => {
        setCurrentUser(AuthService.getCurrentUser());
        
        const unsubscribe = AuthService.addListener((user) => {
            setCurrentUser(user);
        });

        clearFirebaseData();

        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('contextmenu', preventContextMenu);

        const handleBeforeUnload = () => {
            if (gameId.current) {
                navigator.sendBeacon(`https://applegame-76846-default-rtdb.firebaseio.com/games/${gameId.current}/players.json`,
                    JSON.stringify([]));
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            unsubscribe();
            clearInterval(timerRef.current);
            clearTimeout(matchingTimer.current);

            if (gameRef.current) {
                off(gameRef.current);
            }
            if (playersRef.current) {
                off(playersRef.current);
            }

            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('contextmenu', preventContextMenu);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [handleGlobalMouseUp]);

    // 시간 포맷팅
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };    return (
        <div className="classic-mode-container">
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'green', color: 'white', padding: '5px', zIndex: 9999 }}>
                PartnerMode Fixed - State: {gameState} - 튕김 방지됨!
            </div>
            {gameState === 'lobby' || gameState === 'matching' ? renderLobby() : renderGame()}
            {gameState === 'playing' && renderOtherPlayerCursor()}
            
            <button className="ranking-button" onClick={handleRankingClick}>
                <span className="trophy-icon">🏆</span>
            </button>
            
            {showLogin && (
                <Login 
                    onClose={handleLoginClose} 
                    onLoginSuccess={handleLoginSuccess} 
                    currentUser={currentUser}
                />
            )}
            {showRankings && (
                <div className="ranking-modal-overlay">
                    <div className="ranking-modal-content">
                        <div className="ranking-modal-header">
                            <h2>🏆 랭킹</h2>
                            <button onClick={handleCloseRanking} className="close-button">
                                ×
                            </button>
                        </div>
                        <Rankings onBack={handleCloseRanking} isModal={true} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerMode;
