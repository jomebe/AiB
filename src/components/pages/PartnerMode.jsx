import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove, onDisconnect, serverTimestamp, off, get } from 'firebase/database';
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
    console.log('PartnerMode component loaded'); // 디버깅용    // 게임 설정
    const BOARD_SIZE_X = 34;
    const BOARD_SIZE_Y = 20;
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
    const [isSelecting, setIsSelecting] = useState(false);    const [selectionBox, setSelectionBox] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [otherPlayerName, setOtherPlayerName] = useState('');
    const [otherPlayerCursor, setOtherPlayerCursor] = useState({ x: 0, y: 0 });

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
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.current.currentTime + 0.1);        gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.35, audioContext.current.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);

        oscillator.start();
        oscillator.stop(audioContext.current.currentTime + 0.1);
    }, []);

    // 게임 보드 생성
    const generateBoard = useCallback(() => {
        console.log('generateBoard called! BOARD_SIZE_X:', BOARD_SIZE_X, 'BOARD_SIZE_Y:', BOARD_SIZE_Y);
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
        console.log('Generated board:', newBoard.length, 'rows x', newBoard[0]?.length, 'cols');
        console.log('First 5 rows:', newBoard.slice(0, 5));
        console.log('Last 5 rows:', newBoard.slice(-5));
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
        }        board[startY][startX + len - 1] = remainingSum;
    };

    // Firebase 데이터 초기화 (모든 게임과 플레이어 데이터 삭제)
    const clearFirebaseData = async () => {
        try {
            console.log('Clearing Firebase data...');
            await remove(ref(database, 'games'));
            await remove(ref(database, 'players'));
            console.log('Firebase data cleared successfully');
        } catch (error) {
            console.error('Error clearing Firebase data:', error);
        }
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

        try {            // 플레이어 등록
            await set(ref(database, `players/${playerId.current}`), {
                name: playerName,
                status: 'searching',
                timestamp: serverTimestamp()
            });

            // 연결 해제 시 자동 정리 설정
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
    };    // 매칭 가능한 플레이어 찾기
    const findMatchingPlayer = () => {
        const playersRef = ref(database, 'players');
        const gamesRef = ref(database, 'games');
        let isMatched = false; // 중복 매칭 방지
        let gamesListener = null;
        let playersListener = null;
        
        // 리스너 정리 함수
        const cleanupListeners = () => {
            if (gamesListener) off(gamesRef, gamesListener);
            if (playersListener) off(playersRef, playersListener);
        };
        
        // 먼저 기존 게임에 참가할 수 있는지 확인
        gamesListener = onValue(gamesRef, (snapshot) => {
            if (isMatched) return; // 이미 매칭되었으면 무시
            
            const games = snapshot.val();
            if (games) {
                const waitingGames = Object.entries(games).filter(([gameId, game]) => 
                    game.status === 'waiting' && 
                    game.players.length === 1 && 
                    !game.players.includes(playerId.current)
                );

                if (waitingGames.length > 0) {
                    isMatched = true; // 매칭 상태로 설정
                    const [gameIdStr, gameData] = waitingGames[0];
                    cleanupListeners();
                    joinExistingGame(gameIdStr, gameData);
                    return;
                }
            }

            // 기존 게임이 없으면 다른 플레이어 찾기 (한 번만 설정)
            if (!playersListener) {
                playersListener = onValue(playersRef, (snapshot) => {
                    if (isMatched) return; // 이미 매칭되었으면 무시
                    
                    const players = snapshot.val();
                    if (!players) return;

                    // 자신을 제외한 매칭 중인 플레이어 찾기
                    const otherPlayers = Object.entries(players).filter(([id, player]) => 
                        id !== playerId.current && 
                        player.status === 'searching'
                    );

                    if (otherPlayers.length > 0) {
                        isMatched = true; // 매칭 상태로 설정
                        const [foundPlayerId, foundPlayer] = otherPlayers[0];
                        cleanupListeners();
                        createGame(foundPlayerId, foundPlayer.name);
                    }
                });
            }
        });
    };// 게임 생성
    const createGame = async (otherPlayer, otherName) => {
        // 이미 게임이 생성 중이면 중단
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

        console.log('Creating new game:', newGameId);

        try {
            // 상대방 플레이어의 상태를 'playing'으로 먼저 변경하여 중복 매칭 방지
            await set(ref(database, `players/${otherPlayer}/status`), 'playing');
            await set(ref(database, `players/${playerId.current}/status`), 'playing');

            // 게임 데이터 생성
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

            // 다른 플레이어가 참가할 때까지 대기
            const gameRef = ref(database, `games/${newGameId}`);
            const unsubscribe = onValue(gameRef, (snapshot) => {
                const gameData = snapshot.val();
                if (gameData && gameData.players.length === 2 && gameData.status === 'playing') {
                    unsubscribe();
                    startMultiplayerGame(newBoard);
                }
            });// 플레이어 상태 업데이트
            await set(ref(database, `players/${playerId.current}/status`), 'playing');

        } catch (error) {
            console.error('게임 생성 오류:', error);
            setStatusMessage('게임 생성 중 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };    // 기존 게임에 참가
    const joinExistingGame = async (existingGameId, gameData) => {
        try {
            clearTimeout(matchingTimer.current);
            
            gameId.current = existingGameId;
            setIsHost(false);
            
            // 상대방 정보 설정
            const hostId = gameData.players[0];
            otherPlayerId.current = hostId;
            
            // 호스트 이름 가져오기
            const hostSnapshot = await get(ref(database, `players/${hostId}`));
            if (hostSnapshot.exists()) {
                setOtherPlayerName(hostSnapshot.val().name);
            }
            
            // 게임에 참가
            await set(ref(database, `games/${existingGameId}/players`), [...gameData.players, playerId.current]);
            await set(ref(database, `games/${existingGameId}/status`), 'playing');
            await set(ref(database, `games/${existingGameId}/scores/${playerId.current}`), 0);
            
            // 플레이어 상태 업데이트
            await set(ref(database, `players/${playerId.current}/status`), 'playing');
            
            // 기존 게임 보드로 게임 시작
            startMultiplayerGame(gameData.gameBoard);
            
        } catch (error) {
            console.error('게임 참가 오류:', error);
            setStatusMessage('게임 참가 중 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };    // 멀티플레이어 게임 시작
    const startMultiplayerGame = (board) => {
        console.log('Starting multiplayer game with board:', board.length, 'rows x', board[0]?.length, 'cols');
        setGameState('playing');
        setGameOver(false);
        setScore(0);
        setPartnerScore(0);
        
        // 호스트만 타이머를 초기화하고, 비호스트는 Firebase에서 받은 값 사용
        if (isHost) {
            setRemainingTime(TIMER_DURATION);
        }
        
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
            if (!gameData) {
                // 게임이 삭제되었으면 로비로 돌아가기
                console.log('Game deleted, returning to lobby');
                resetToLobby();
                return;
            }

            // 플레이어 수 확인
            if (gameData.players && gameData.players.length < 2) {
                console.log('Player left the game, only', gameData.players.length, 'players remaining');
                // 상대방이 나갔음을 알리고 잠시 후 로비로 돌아가기
                alert('상대방이 게임을 나갔습니다. 로비로 돌아갑니다.');
                setTimeout(() => resetToLobby(), 2000);
                return;
            }

            // 점수 동기화
            if (gameData.scores) {
                setScore(gameData.scores[playerId.current] || 0);
                setPartnerScore(gameData.scores[otherPlayerId.current] || 0);
            }

            // 보드 동기화
            if (gameData.gameBoard) {
                console.log('Received board from Firebase:', gameData.gameBoard.length, 'rows x', gameData.gameBoard[0]?.length, 'cols');
                setGameBoard(gameData.gameBoard);
            }            // 타이머 동기화 (호스트가 아닌 경우만)
            if (typeof gameData.timer === 'number' && !isHost) {
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
    };    // 타이머 시작
    const startTimer = () => {
        if (isHost) {
            // 호스트만 타이머를 실제로 관리
            timerRef.current = setInterval(async () => {
                setRemainingTime(prev => {
                    const newTime = prev - 1;
                    
                    // Firebase에 타이머 업데이트
                    if (gameId.current) {
                        set(ref(database, `games/${gameId.current}/timer`), newTime);
                    }
                    
                    if (newTime <= 0) {
                        endGame();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        }
        // 비호스트는 Firebase 리스너를 통해서만 타이머 값을 받음
    };    // 게임 종료
    const endGame = async () => {
        // 호스트만 타이머 정리
        if (isHost) {
            clearInterval(timerRef.current);
        }
        
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
        }        // 플레이어 데이터 정리
        try {
            // 현재 플레이어를 게임에서 제거
            if (gameId.current) {
                await removePlayerFromGame(playerId.current);
            }
            
            // 플레이어 데이터 삭제
            await remove(ref(database, `players/${playerId.current}`));
        } catch (error) {
            console.error('데이터 정리 오류:', error);
        }

        // refs 초기화
        gameId.current = null;
        otherPlayerId.current = null;
        playerId.current = Math.random().toString(36).substring(2, 15);
    };

    // 게임에서 플레이어 제거 및 게임 정리
    const removePlayerFromGame = async (playerIdToRemove) => {
        if (!gameId.current) return;

        try {
            const gameRef = ref(database, `games/${gameId.current}`);
            const gameSnapshot = await get(gameRef);
            
            if (!gameSnapshot.exists()) return;
            
            const gameData = gameSnapshot.val();
            const players = gameData.players || [];
            
            // 플레이어 목록에서 제거
            const updatedPlayers = players.filter(id => id !== playerIdToRemove);
            
            if (updatedPlayers.length === 0) {
                // 모든 플레이어가 나갔으면 게임 삭제
                console.log('All players left, deleting game:', gameId.current);
                await remove(gameRef);
            } else {
                // 남은 플레이어가 있으면 플레이어 목록만 업데이트
                await set(ref(database, `games/${gameId.current}/players`), updatedPlayers);
                
                // 점수도 삭제
                if (gameData.scores && gameData.scores[playerIdToRemove]) {
                    await remove(ref(database, `games/${gameId.current}/scores/${playerIdToRemove}`));
                }
                
                // 선택 데이터도 삭제
                await remove(ref(database, `games/${gameId.current}/selections/${playerIdToRemove}`));
                await remove(ref(database, `games/${gameId.current}/cursors/${playerIdToRemove}`));
            }
        } catch (error) {
            console.error('게임에서 플레이어 제거 오류:', error);
        }
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
    };    // 컴포넌트 마운트/언마운트 시 처리
    useEffect(() => {
        // 컴포넌트 마운트 시 Firebase 데이터 초기화
        clearFirebaseData();
        
        // 브라우저 탭/창 닫힘 감지
        const handleBeforeUnload = () => {
            if (gameId.current) {
                // 동기적으로 플레이어 제거 (비동기는 브라우저 종료 시 실행되지 않을 수 있음)
                navigator.sendBeacon(`https://applegame-76846-default-rtdb.firebaseio.com/games/${gameId.current}/players.json`, 
                    JSON.stringify([]));
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
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
            
            // 이벤트 리스너 제거
            window.removeEventListener('beforeunload', handleBeforeUnload);
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
        <div className="game-container">            <div className="header">
                <h1>사과 상자 게임 - 협동모드</h1>                <div className="score-display">
                    <div className="total-score">
                        <span className="score-label">총 점수</span>
                        <span className="score-value">{(score || 0) + (partnerScore || 0)}</span>
                    </div>
                    <div className="individual-scores">
                        <div className="player-score player1-score">
                            <span className="player-color player1-color">●</span>
                            <span className="player-name">{playerName || '플레이어1'}</span>
                            <span className="score-value">{score || 0}</span>
                        </div>
                        <div className="player-score player2-score">
                            <span className="player-color player2-color">●</span>
                            <span className="player-name">{otherPlayerName || '플레이어2'}</span>
                            <span className="score-value">{partnerScore || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="game-area">                <div 
                    className="game-board"
                    ref={gameBoardRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => setIsSelecting(false)}
                >
                    {gameBoard.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (                            <div
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
                </div>                <div className="timer-container">
                    <div 
                        className="timer-bar"
                        style={{ height: `${(remainingTime / TIMER_DURATION) * 100}%` }}
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
        <div className="partner-mode">
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'red', color: 'white', padding: '5px', zIndex: 9999 }}>
                PartnerMode Loaded - State: {gameState}
            </div>
            {gameState === 'lobby' || gameState === 'matching' ? renderLobby() : renderGame()}
            {gameState === 'playing' && renderOtherPlayerCursor()}
        </div>
    );
};

export default PartnerMode;
