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
    console.log('PartnerMode component loaded'); // 디버깅용      // 게임 설정 - ClassicMode와 동일하게
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
    const [playerName, setPlayerName] = useState('');    const [statusMessage, setStatusMessage] = useState('');
    const [gameBoard, setGameBoard] = useState([]);
    const [score, setScore] = useState(0);
    const [partnerScore, setPartnerScore] = useState(0);
    const [remainingTime, setRemainingTime] = useState(TIMER_DURATION);
    const [gameOver, setGameOver] = useState(false);    const [selectedCells, setSelectedCells] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [otherPlayerSelecting, setOtherPlayerSelecting] = useState(false); // 상대방의 선택 상태 추적const [isHost, setIsHost] = useState(false);
    const [otherPlayerName, setOtherPlayerName] = useState('');
    const [otherPlayerCursor, setOtherPlayerCursor] = useState({ x: 0, y: 0 });    const [currentUser, setCurrentUser] = useState(null);
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
    const playersRef = useRef(null);    // 랜덤 숫자 생성
    const getRandomAppleValue = () => Math.floor(Math.random() * MAX_APPLE_VALUE) + 1;

    // 드래그 방지 함수들 - ClassicMode와 동일
    const preventDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
    
    const preventContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

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
        gainNode.gain.linearRampToValueAtTime(0.35, audioContext.current.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.current.currentTime + 0.1);
    }, []);    // 해결책 존재 확인
    const hasSolution = (board) => {
        // 가로 검사
        for (let i = 0; i < BOARD_SIZE_Y; i++) {
            for (let j = 0; j < BOARD_SIZE_X - 1; j++) {
                if (board[i][j].isVisible && board[i][j + 1].isVisible && 
                    board[i][j].value + board[i][j + 1].value === TARGET_SUM) return true;
                if (j < BOARD_SIZE_X - 2 && board[i][j].isVisible && board[i][j + 1].isVisible && board[i][j + 2].isVisible &&
                    board[i][j].value + board[i][j + 1].value + board[i][j + 2].value === TARGET_SUM) return true;
            }
        }

        // 세로 검사
        for (let j = 0; j < BOARD_SIZE_X; j++) {
            for (let i = 0; i < BOARD_SIZE_Y - 1; i++) {
                if (board[i][j].isVisible && board[i + 1][j].isVisible &&
                    board[i][j].value + board[i + 1][j].value === TARGET_SUM) return true;
                if (i < BOARD_SIZE_Y - 2 && board[i][j].isVisible && board[i + 1][j].isVisible && board[i + 2][j].isVisible &&
                    board[i][j].value + board[i + 1][j].value + board[i + 2][j].value === TARGET_SUM) return true;
            }
        }

        // 직사각형 검사
        for (let width = 2; width <= 3; width++) {
            for (let height = 2; height <= 2; height++) {
                for (let i = 0; i <= BOARD_SIZE_Y - height; i++) {
                    for (let j = 0; j <= BOARD_SIZE_X - width; j++) {
                        let sum = 0;
                        let allVisible = true;
                        for (let di = 0; di < height; di++) {
                            for (let dj = 0; dj < width; dj++) {
                                if (!board[i + di][j + dj].isVisible) {
                                    allVisible = false;
                                    break;
                                }
                                sum += board[i + di][j + dj].value;
                            }
                            if (!allVisible) break;
                        }
                        if (allVisible && sum === TARGET_SUM) return true;
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
            board[startY][startX + i].value = val;
            board[startY][startX + i].isVisible = true;
            remainingSum -= val;
        }
        
        board[startY][startX + len - 1].value = remainingSum;
        board[startY][startX + len - 1].isVisible = true;
    };

    // 해결책 보장
    const ensureSolution = (board) => {
        if (!hasSolution(board)) {
            createSolution(board);
        }
    };    // 게임 보드 생성
    const generateBoard = () => {
        console.log('generateBoard called! BOARD_SIZE_X:', BOARD_SIZE_X, 'BOARD_SIZE_Y:', BOARD_SIZE_Y);
        // 클래식 모드와 동일한 구조로 생성 (객체 형태로)
        const newBoard = Array(BOARD_SIZE_Y).fill().map(() => 
            Array(BOARD_SIZE_X).fill().map(() => ({
                value: getRandomAppleValue(),
                isVisible: true
            }))
        );

        // 해결책 보장
        ensureSolution(newBoard);
        console.log('Generated board:', newBoard.length, 'rows x', newBoard[0]?.length, 'cols');
        return newBoard;
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
    };

    // 매칭 시작
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
    };

    // 매칭 가능한 플레이어 찾기
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
    };

    // 게임 생성
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
            });

            // 플레이어 상태 업데이트
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

        // 호스트만 타이머를 초기화하고 Firebase에 설정
        if (isHost) {
            console.log('Host initializing timer to', TIMER_DURATION);
            setRemainingTime(TIMER_DURATION);
            // Firebase에 초기 타이머 값 설정
            if (gameId.current) {
                set(ref(database, `games/${gameId.current}/timer`), TIMER_DURATION);
            }
        } else {
            console.log('Non-host waiting for timer from Firebase');
            // 비호스트는 Firebase에서 타이머 값을 받을 때까지 대기
        }        setSelectedCells([]);
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
            }            // 보드 동기화 - 양쪽 플레이어 모두 드래그 중이 아닐 때만 업데이트
            if (gameData.gameBoard && !isSelecting && !otherPlayerSelecting) {
                console.log('Received board from Firebase:', gameData.gameBoard.length, 'rows x', gameData.gameBoard[0]?.length, 'cols');
                setGameBoard(gameData.gameBoard);
            } else if (gameData.gameBoard && (isSelecting || otherPlayerSelecting)) {
                console.log('Board update ignored - player(s) currently selecting. Current:', isSelecting, 'Other:', otherPlayerSelecting);
            }// 타이머 동기화 (호스트가 아닌 경우만)
            if (typeof gameData.timer === 'number' && !isHost) {
                console.log('Non-host receiving timer update from Firebase:', gameData.timer);
                setRemainingTime(gameData.timer);
                
                // 게임 종료 체크
                if (gameData.timer <= 0) {
                    console.log('Timer reached 0 via Firebase sync, ending game...');
                    endGame();
                }
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
        });        // 상대방 선택 리스너
        const selectionsRef = ref(database, `games/${gameId.current}/selections/${otherPlayerId.current}`);        onValue(selectionsRef, (snapshot) => {
            const selectionData = snapshot.val();
            if (selectionData) {
                // Partner selection handling logic can be implemented here if needed
                console.log('Partner selection data:', selectionData);
            }
        });

        // 상대방 선택 상태 리스너
        const otherSelectingRef = ref(database, `games/${gameId.current}/selectingState/${otherPlayerId.current}`);
        onValue(otherSelectingRef, (snapshot) => {
            const isOtherSelecting = snapshot.val();
            if (typeof isOtherSelecting === 'boolean') {
                setOtherPlayerSelecting(isOtherSelecting);
                console.log('Other player selecting state:', isOtherSelecting);
            }
        });
    };    // 타이머 시작 - 호스트만 실행
    const startTimer = () => {
        console.log('startTimer called - isHost:', isHost, 'playerId:', playerId.current);
        
        if (isHost) {
            console.log('Host starting timer...');
            // 호스트만 타이머를 실제로 관리
            timerRef.current = setInterval(async () => {
                setRemainingTime(prev => {
                    const newTime = Math.max(0, prev - 1);
                    console.log('Host timer update:', newTime);

                    // Firebase에 타이머 업데이트
                    if (gameId.current) {
                        set(ref(database, `games/${gameId.current}/timer`), newTime);
                    }

                    if (newTime <= 0) {
                        console.log('Timer reached 0, ending game...');
                        endGame();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            console.log('Non-host player, waiting for timer updates from Firebase...');
            // 비호스트는 Firebase 리스너를 통해서만 타이머 값을 받음
        }
    };    // 게임 종료
    const endGame = async () => {
        console.log('endGame called - isHost:', isHost, 'gameOver:', gameOver);
        
        // 이미 게임이 종료된 경우 중복 실행 방지
        if (gameOver) return;
        
        // 호스트만 타이머 정리
        if (isHost) {
            console.log('Host clearing timer...');
            clearInterval(timerRef.current);
        }

        setGameOver(true);
        setGameState('ended');

        // 호스트만 게임 상태 업데이트
        if (isHost && gameId.current) {
            console.log('Host updating game status to ended...');
            try {
                await set(ref(database, `games/${gameId.current}/status`), 'ended');
                await set(ref(database, `games/${gameId.current}/timer`), 0);
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
        setStatusMessage('');        setScore(0);
        setPartnerScore(0);
        setRemainingTime(TIMER_DURATION);
        setGameOver(false);
        setSelectedCells([]);
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
    };    // 전역 마우스 업 이벤트 핸들러 - ClassicMode와 동일
    const handleGlobalMouseUp = useCallback((e) => {
        mouseIsDownRef.current = false;
        
        if (isSelecting) {
            handleMouseUp(e);
        }
    }, [isSelecting]); // eslint-disable-line react-hooks/exhaustive-deps

    // 마우스 이벤트 핸들러 - ClassicMode와 동일    const handleMouseDown = (e) => {
        // 우클릭 무시
        if (e.button === 2) return;
        
        if (gameOver || gameState !== 'playing') return;
        mouseIsDownRef.current = true;
        
        const boardRect = gameBoardRef.current.getBoundingClientRect();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        
        setIsSelecting(true);
        setSelectedCells([]);
        startPos.current = { x, y };
          // 선택 상자 생성
        createSelectionBox(x, y);

        // 커서 위치 및 선택 상태 전송
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/cursors/${playerId.current}`), {
                x: e.clientX,
                y: e.clientY
            });
            // 선택 시작 상태 전송
            set(ref(database, `games/${gameId.current}/selectingState/${playerId.current}`), true);
        }
    };

    const handleMouseMove = (e) => {
        if (!isSelecting || !mouseIsDownRef.current) return;
        
        const boardRect = gameBoardRef.current.getBoundingClientRect();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        
        updateSelectionBox(x, y);
        updateSelectedCells();
        
        // 텍스트 선택 방지
        e.preventDefault();
        e.stopPropagation();

        // 커서 위치 전송
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/cursors/${playerId.current}`), {
                x: e.clientX,
                y: e.clientY
            });
        }
    };

    // 선택 상태 완전 정리 - ClassicMode와 동일
    const cleanupSelection = () => {
        // 모든 셀에서 선택 클래스 제거
        document.querySelectorAll('.apple-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // 선택 상자 제거
        if (selectionBoxRef.current) {
            selectionBoxRef.current.remove();
            selectionBoxRef.current = null;
        }
        
        mouseIsDownRef.current = false;
        setIsSelecting(false);
        setSelectedCells([]);
    };    const handleMouseUp = (e) => {
        if (!isSelecting) return;
        
        checkSelection();
        cleanupSelection();
        
        // 텍스트 선택 방지
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 선택 영역 및 선택 상태 종료 전송
        if (gameId.current) {
            set(ref(database, `games/${gameId.current}/selections/${playerId.current}`), selectedCells);
            // 선택 종료 상태 전송
            set(ref(database, `games/${gameId.current}/selectingState/${playerId.current}`), false);
        }

        // 드래그 종료 후 잠시 후 보드 상태 다시 동기화
        setTimeout(() => {
            if (gameRef.current) {
                get(gameRef.current).then((snapshot) => {
                    const gameData = snapshot.val();
                    if (gameData && gameData.gameBoard && !isSelecting) {
                        console.log('Re-syncing board after drag completion');
                        setGameBoard(gameData.gameBoard);
                    }
                });
            }
        }, 500);
    };

    // 마우스 리브 이벤트 - ClassicMode와 동일
    const handleMouseLeave = (e) => {
        if (isSelecting) {
            handleMouseUp(e);
        }
    };
    
    // 선택 상자 생성 - ClassicMode와 동일
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
    
    // 선택 상자 업데이트 - ClassicMode와 동일
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
    };    // 선택된 셀 업데이트 - ClassicMode와 동일
    const updateSelectedCells = () => {
        if (!selectionBoxRef.current) return;
        
        const selectionRect = selectionBoxRef.current.getBoundingClientRect();
        const cells = document.querySelectorAll('.apple-cell');
        const selectedCellsData = [];
        
        cells.forEach(cell => {
            cell.classList.remove('selected');
            
            if (!cell.dataset.value) return;
            
            const cellRect = cell.getBoundingClientRect();
            
            // 셀의 중심점
            const cellCenterX = cellRect.left + cellRect.width / 2;
            const cellCenterY = cellRect.top + cellRect.height / 2;
            
            // 중심점이 선택 상자 내에 있는지 확인
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
    };    // 선택 확인 - ClassicMode와 유사하게 수정
    const checkSelection = async () => {
        if (selectedCells.length < 2) return;

        const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
        console.log('선택된 셀:', selectedCells, '합계:', sum);

        if (sum === TARGET_SUM) {
            createPopSound();
            const newScore = score + sum * selectedCells.length;
            console.log('점수 업데이트:', score, '->', newScore);
            
            setScore(newScore);

            // 애니메이션 효과를 위해 선택된 셀에 클래스 추가
            selectedCells.forEach(cell => {
                const cellElement = document.querySelector(`.board-cell[data-row="${cell.row}"][data-col="${cell.col}"] .apple-image`);
                if (cellElement) {
                    // 펑 터지는 애니메이션 적용
                    cellElement.classList.add('apple-explode');
                      // 애니메이션이 끝나면 사과 제거
                    setTimeout(() => {
                        setGameBoard(prevBoard => {
                            const newBoard = [...prevBoard];
                            newBoard[cell.row][cell.col].isVisible = false;
                            return newBoard;
                        });
                    }, 250); // 애니메이션 시간과 맞춤 (0.25초)
                }
            });            // Firebase에 업데이트 - 약간의 지연을 두어 상대방의 선택 중단을 방지
            if (gameId.current) {
                try {
                    // 애니메이션이 완료된 후 보드 업데이트
                    setTimeout(async () => {
                        const newBoard = gameBoard.map(row => [...row]);
                        selectedCells.forEach(({ row, col }) => {
                            newBoard[row][col].isVisible = false;
                        });
                        
                        await set(ref(database, `games/${gameId.current}/gameBoard`), newBoard);
                        await set(ref(database, `games/${gameId.current}/scores/${playerId.current}`), newScore);
                        console.log('Board updated to Firebase after animation');
                    }, 300); // 애니메이션 시간보다 조금 더 늦게
                } catch (error) {
                    console.error('게임 데이터 업데이트 오류:', error);
                }
            }

            // 해결책이 없으면 게임 종료 (newBoard를 재정의)
            const updatedBoard = gameBoard.map(row => [...row]);
            selectedCells.forEach(({ row, col }) => {
                updatedBoard[row][col].isVisible = false;
            });
            
            if (!hasSolution(updatedBoard)) {
                setTimeout(endGame, 500);
            }
        }

        setSelectedCells([]);
    };    // 컴포넌트 마운트/언마운트 시 처리
    useEffect(() => {
        // 인증 상태 확인
        setCurrentUser(AuthService.getCurrentUser());
        
        // 인증 상태 변경 리스너 등록
        const unsubscribe = AuthService.addListener((user) => {
            setCurrentUser(user);
        });

        // 컴포넌트 마운트 시 Firebase 데이터 초기화
        clearFirebaseData();

        // 전역 이벤트 리스너 추가 - ClassicMode와 동일
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('contextmenu', preventContextMenu);

        // 브라우저 탭/창 닫힘 감지
        const handleBeforeUnload = () => {
            if (gameId.current) {
                // 동기적으로 플레이어 제거 (비동기는 브라우저 종료 시 실행되지 않을 수 있음)
                navigator.sendBeacon(`https://applegame-76846-default-rtdb.firebaseio.com/games/${gameId.current}/players.json`,
                    JSON.stringify([]));
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);        return () => {
            unsubscribe();
            clearInterval(timerRef.current);
            clearTimeout(matchingTimer.current);            // Firebase 리스너 정리
            if (gameRef.current) {
                off(gameRef.current);
            }
            const currentPlayersRef = playersRef.current; // eslint-disable-line react-hooks/exhaustive-deps
            if (currentPlayersRef) {
                off(currentPlayersRef);
            }

            // 전역 이벤트 리스너 제거 - ClassicMode와 동일
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('contextmenu', preventContextMenu);            // 이벤트 리스너 제거
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [handleGlobalMouseUp]); // eslint-disable-line react-hooks/exhaustive-deps

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
                </div>                <div className="status-message">{statusMessage}</div>
                <div className="player-count">접속자 수: 2명</div>            </div>
        </div>
    );

    // 게임 화면 렌더링
    const renderGame = () => (
        <div className="game-container"><div className="header">
                <h1>사과 상자 게임 - 협동모드</h1>
            </div>

            <div className="game-area">
                <div className="timer-score-sidebar">
                    <div className="timer-display">
                        <span className="timer-value">{formatTime(remainingTime)}</span>
                    </div>
                    
                    {/* 점수 표시를 사이드바로 이동 */}
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
                </div><div
                    className="game-board"
                    ref={gameBoardRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onDragStart={preventDrag}
                    onContextMenu={preventContextMenu}
                >
                    {/* 게임 보드를 행과 열로 명확하게 렌더링 - ClassicMode와 동일 */}
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
                                    {cell.isVisible && (                                        <img 
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
        >            <span className="player-name">{otherPlayerName}</span>
        </div>
    );

    // 랭킹 핸들러 - ClassicMode와 동일
    const handleRankingClick = () => {
        setShowRankings(true);
    };

    // 랭킹 팝업 닫기
    const handleCloseRanking = () => {
        setShowRankings(false);
    };

    // 로그인 성공 처리    // 로그인 성공 처리
    const handleLoginSuccess = (user) => {
        setCurrentUser(user);
        setShowLogin(false);
        console.log('로그인 성공:', user);
    };

    // 로그인 모달 닫기
    const handleLoginClose = () => {
        setShowLogin(false);
        // 최신 인증 상태 확인
        setCurrentUser(AuthService.getCurrentUser());
    };

    return (
        <div className="classic-mode-container">
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'red', color: 'white', padding: '5px', zIndex: 9999 }}>
                PartnerMode Loaded - State: {gameState}
            </div>
            {gameState === 'lobby' || gameState === 'matching' ? renderLobby() : renderGame()}
            {gameState === 'playing' && renderOtherPlayerCursor()}
            
            {/* 랭킹 버튼 - ClassicMode와 동일 */}
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
 // PartnerMode 함수 끝

export default PartnerMode;
