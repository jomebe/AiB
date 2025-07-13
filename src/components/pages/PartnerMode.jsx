import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove, onDisconnect, serverTimestamp, off, get } from 'firebase/database';
import '../styles/ClassicMode.css';
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
      // 게임 설정 - ClassicMode와 동일하게
    const BOARD_SIZE_X = 15; // 가로 칸 수 (ClassicMode와 동일)
    const BOARD_SIZE_Y = 10; // 세로 칸 수 (ClassicMode와 동일)
    const TARGET_SUM = 10;
    const MAX_APPLE_VALUE = 9;
    const TIMER_DURATION = 120; // 2분 (ClassicMode와 동일)
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

    // refs
    const gameBoardRef = useRef(null);
    const timerRef = useRef(null);
    const playerId = useRef(`player_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`);
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
        gainNode.gain.linearRampToValueAtTime(0.35, audioContext.current.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);

        oscillator.connect(gainNode);
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
        }
        board[startY][startX + len - 1] = remainingSum;
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
                    if (!players) return;                    // 자신을 제외한 매칭 중인 플레이어 찾기
                    const otherPlayers = Object.entries(players).filter(([id, player]) =>
                        id !== playerId.current &&
                        player.status === 'searching' &&
                        player.name !== playerName // 닉네임도 다른지 확인 (자기 자신 방지)
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

    // 게임 생성 (호스트 설정 강화)
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
        
        // 호스트 설정 확실히 하기
        setIsHost(true);
        console.log('Creating new game:', newGameId, '- I am the HOST');

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
                playerNames: {
                    [playerId.current]: playerName
                },
                timer: TIMER_DURATION, // 초기 타이머 값 설정
                status: 'waiting',
                host: playerId.current, // 호스트 명시
                createdAt: serverTimestamp()
            });

            console.log('Game created with initial timer:', TIMER_DURATION);

            // 다른 플레이어가 참가할 때까지 대기
            const gameRef = ref(database, `games/${newGameId}`);
            const unsubscribe = onValue(gameRef, (snapshot) => {
                const gameData = snapshot.val();
                if (gameData && gameData.players.length === 2 && gameData.status === 'playing') {
                    // 참가한 플레이어의 이름 가져오기
                    const joinedPlayerId = gameData.players.find(id => id !== playerId.current);
                    if (joinedPlayerId && gameData.playerNames && gameData.playerNames[joinedPlayerId]) {
                        setOtherPlayerName(gameData.playerNames[joinedPlayerId]);
                        console.log('Joined player name:', gameData.playerNames[joinedPlayerId]);
                    }
                    unsubscribe();
                    startMultiplayerGame(newBoard);
                }
            });

        } catch (error) {
            console.error('게임 생성 오류:', error);
            setStatusMessage('게임 생성 중 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };

    // 기존 게임에 참가 (비호스트 설정 강화)
    const joinExistingGame = async (existingGameId, gameData) => {
        try {
            clearTimeout(matchingTimer.current);

            gameId.current = existingGameId;
            
            // 비호스트 설정 확실히 하기
            setIsHost(false);
            console.log('Joining existing game:', existingGameId, '- I am NOT the host');

            // 상대방 정보 설정
            const hostId = gameData.players[0];
            otherPlayerId.current = hostId;

            // 호스트 이름 가져오기 - 게임 데이터에서 먼저 확인
            let hostName = 'Player 2';
            if (gameData.playerNames && gameData.playerNames[hostId]) {
                hostName = gameData.playerNames[hostId];
                console.log('Host name from game data:', hostName);
            } else {
                // 플레이어 데이터에서 가져오기 (백업)
                try {
                    const hostSnapshot = await get(ref(database, `players/${hostId}`));
                    if (hostSnapshot.exists()) {
                        hostName = hostSnapshot.val().name || 'Player 2';
                        console.log('Host name from player data:', hostName);
                    }
                } catch (error) {
                    console.error('Error getting host name:', error);
                }
            }
            setOtherPlayerName(hostName);

            // 게임에 참가
            await set(ref(database, `games/${existingGameId}/players`), [...gameData.players, playerId.current]);
            await set(ref(database, `games/${existingGameId}/status`), 'playing');
            await set(ref(database, `games/${existingGameId}/scores/${playerId.current}`), 0);
            await set(ref(database, `games/${existingGameId}/playerNames/${playerId.current}`), playerName);

            // 플레이어 상태 업데이트
            await set(ref(database, `players/${playerId.current}/status`), 'playing');

            console.log('Joined game, initial timer from Firebase:', gameData.timer);

            // 기존 게임 보드로 게임 시작
            startMultiplayerGame(gameData.gameBoard);

        } catch (error) {
            console.error('게임 참가 오류:', error);
            setStatusMessage('게임 참가 중 오류가 발생했습니다.');
            setTimeout(resetToLobby, 2000);
        }
    };

    // 멀티플레이어 게임 시작 (로컬 타이머 사용)
    const startMultiplayerGame = (board) => {
        console.log('Starting multiplayer game with board:', board.length, 'rows x', board[0]?.length, 'cols');
        console.log('Player is host:', isHost, 'Game ID:', gameId.current);
        
        setGameState('playing');
        setGameOver(false);
        setScore(0);
        setPartnerScore(0);
        setSelectedCells([]);
        setPartnerSelectedCells([]);
        setGameBoard(board);
        
        // 로컬 타이머 즉시 시작 - Firebase 동기화 안 함
        setRemainingTime(TIMER_DURATION);
        console.log('Starting local timer with:', TIMER_DURATION, 'seconds');
        
        initAudioContext();
        
        // 로컬 타이머 바로 시작
        startLocalTimer();
        
        setupGameListeners();
    };    // 게임 리스너 설정 (에러 처리 강화)
    const setupGameListeners = () => {
        if (!gameId.current || !database) {
            console.error('Cannot setup listeners - missing gameId or database');
            return;
        }

        try {
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

                // 점수 동기화 (로깅 강화)
                if (gameData.scores) {
                    const myNewScore = gameData.scores[playerId.current] || 0;
                    const partnerNewScore = gameData.scores[otherPlayerId.current] || 0;
                    console.log('Score sync - my score:', myNewScore, 'partner score:', partnerNewScore);
                    console.log('Previous scores - my:', score, 'partner:', partnerScore);
                    setScore(myNewScore);
                    setPartnerScore(partnerNewScore);
                }

                // 보드 동기화 (selectingStates 체크 제거)
                if (gameData.gameBoard && Array.isArray(gameData.gameBoard)) {
                    console.log('Board sync allowed - updating board from Firebase');
                    setGameBoard(gameData.gameBoard);
                }

                // 게임 상태 확인
                if (gameData.status === 'ended') {
                    endGame();
                }
            }, (error) => {
                console.error('Game listener error:', error);
                setStatusMessage('연결 오류가 발생했습니다. 다시 시도해주세요.');
                setTimeout(() => resetToLobby(), 3000);
            });

            // 상대방 커서 리스너
            if (otherPlayerId.current) {
                const cursorsRef = ref(database, `games/${gameId.current}/cursors/${otherPlayerId.current}`);
                onValue(cursorsRef, (snapshot) => {
                    const cursorData = snapshot.val();
                    if (cursorData && typeof cursorData.x === 'number' && typeof cursorData.y === 'number') {
                        setOtherPlayerCursor(cursorData);
                    }
                }, (error) => {
                    console.error('Cursor listener error:', error);
                });

                // 상대방 선택 리스너
                const selectionsRef = ref(database, `games/${gameId.current}/selections/${otherPlayerId.current}`);
                onValue(selectionsRef, (snapshot) => {
                    const selectionData = snapshot.val();
                    if (selectionData && Array.isArray(selectionData)) {
                        setPartnerSelectedCells(selectionData);
                    }
                }, (error) => {
                    console.error('Selection listener error:', error);
                });
            }

        } catch (error) {
            console.error('Error setting up game listeners:', error);
            setStatusMessage('게임 설정 중 오류가 발생했습니다.');
            setTimeout(() => resetToLobby(), 3000);
        }
    };    // 로컬 타이머 시작 (Firebase 동기화 없음)
    const startLocalTimer = () => {
        console.log('Starting local timer');
        
        // 기존 타이머 정리
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        let currentTime = TIMER_DURATION;
        console.log('Local timer starting with:', currentTime, 'seconds');
        
        timerRef.current = setInterval(() => {
            currentTime--;
            console.log('Local timer tick:', currentTime);
            setRemainingTime(currentTime);

            if (currentTime <= 0) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                console.log('Local timer ended');
                endGame();
            }
        }, 1000);
    };

    // 게임 종료 (점수 기록 및 메인 화면 이동 추가)
    const endGame = async () => {
        console.log('Game ending...');
        console.log('Current scores at game end - score:', score, 'partnerScore:', partnerScore);
        
        // 타이머 정리
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setGameOver(true);
        setGameState('ended');

        // 호스트만 게임 상태 업데이트
        if (isHost && gameId.current) {
            try {
                await set(ref(database, `games/${gameId.current}/status`), 'ended');
                console.log('Game status updated to ended');
            } catch (error) {
                console.error('게임 종료 업데이트 오류:', error);
            }
        }

        // Firebase에서 최신 점수 가져오기
        let finalMyScore = score;
        let finalPartnerScore = partnerScore;
        
        if (gameId.current && database) {
            try {
                const gameSnapshot = await get(ref(database, `games/${gameId.current}`));
                if (gameSnapshot.exists()) {
                    const gameData = gameSnapshot.val();
                    if (gameData.scores) {
                        finalMyScore = gameData.scores[playerId.current] || 0;
                        finalPartnerScore = gameData.scores[otherPlayerId.current] || 0;
                        console.log('Final scores from Firebase - mine:', finalMyScore, 'partner:', finalPartnerScore);
                    }
                }
            } catch (error) {
                console.error('최종 점수 가져오기 오류:', error);
            }
        }
        
        const totalScore = finalMyScore + finalPartnerScore;
        console.log('Final scores - My:', finalMyScore, 'Partner:', finalPartnerScore, 'Total:', totalScore);
        
        // 호스트만 점수 기록 (중복 방지)
        if (isHost) {
            try {
                if (totalScore > 0) {
                    const { submitScore } = await import('../../utils/api');
                    const { getAuth } = await import('../../utils/auth');
                    
                    const auth = getAuth();
                    if (auth.user) {
                        console.log('Host submitting partner mode score:', totalScore);
                        const result = await submitScore('partner', totalScore);
                        console.log('Score submission result:', result);
                    }
                }
            } catch (error) {
                console.error('점수 기록 실패:', error);
            }
        }
        
        // 모든 플레이어에게 점수 팝업 표시
        setTimeout(() => {
            const confirmed = window.confirm(`게임 종료!\n내 점수: ${finalMyScore}\n파트너 점수: ${finalPartnerScore}\n총 점수: ${totalScore}\n\n확인을 누르면 메인 화면으로 돌아갑니다.`);
            
            if (confirmed) {
                // 메인 화면으로 이동
                onBack();
            }
        }, 300);
    };

    // 로비로 돌아가기 (메모리 누수 방지)
    const resetToLobby = async () => {
        console.log('Resetting to lobby...');
        
        // 먼저 타이머와 리스너 정리
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        if (matchingTimer.current) {
            clearTimeout(matchingTimer.current);
            matchingTimer.current = null;
        }

        // Firebase 리스너 정리
        if (gameRef.current) {
            off(gameRef.current);
            gameRef.current = null;
        }
        if (playersRef.current) {
            off(playersRef.current);
            playersRef.current = null;
        }

        // 상태 초기화
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
        setIsSelecting(false);
        // 선택 박스 제거 - setSelectionBox(null) 호출 안 함
        setIsHost(false);
        setOtherPlayerName('');

        // Firebase 데이터 정리 (비동기로 처리)
        try {
            if (gameId.current) {
                await removePlayerFromGame(playerId.current);
            }
            await remove(ref(database, `players/${playerId.current}`));
            console.log('Firebase cleanup completed');
        } catch (error) {
            console.error('데이터 정리 오류:', error);
        }

        // refs 초기화
        gameId.current = null;
        otherPlayerId.current = null;
        playerId.current = `player_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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
                }                // 선택 데이터 삭제 (selectingStates 제거)
                await remove(ref(database, `games/${gameId.current}/selections/${playerIdToRemove}`));
                await remove(ref(database, `games/${gameId.current}/cursors/${playerIdToRemove}`));
            }
        } catch (error) {
            console.error('게임에서 플레이어 제거 오류:', error);
        }
    };    // 마우스 이벤트 핸들러 (줌/스케일 안전, 선택 박스 제거)
    const handleMouseDown = async (e) => {
        if (gameOver || gameState !== 'playing') return;
        e.preventDefault();

        const rect = gameBoardRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        startPos.current = { x, y };
        setIsSelecting(true);
        // 선택 박스 제거 - setSelectionBox 호출 안 함

        // 선택 상태를 Firebase에 동기화 (selectingStates 제거)
        if (gameId.current) {
            try {
                // 선택 상태 동기화 제거 - 타이머 간섭 방지
                // 커서 위치 전송 (절대 좌표)
                await set(ref(database, `games/${gameId.current}/cursors/${playerId.current}`), {
                    x: e.clientX,
                    y: e.clientY
                });
            } catch (error) {
                console.error('Firebase 커서 위치 업데이트 오류:', error);
            }
        }
    };

    const handleMouseMove = async (e) => {
        if (!isSelecting || gameOver || gameState !== 'playing') return;
        e.preventDefault();

        const rect = gameBoardRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const left = Math.min(startPos.current.x, x);
        const top = Math.min(startPos.current.y, y);
        const width = Math.abs(x - startPos.current.x);
        const height = Math.abs(y - startPos.current.y);

        // 선택 박스 업데이트 제거 - setSelectionBox 호출 안 함
        updateSelectedCells(left, top, width, height);

        // 커서 위치 전송 (절대 좌표)
        if (gameId.current) {
            try {
                await set(ref(database, `games/${gameId.current}/cursors/${playerId.current}`), {
                    x: e.clientX,
                    y: e.clientY
                });
            } catch (error) {
                console.error('Firebase 커서 위치 업데이트 오류:', error);
            }
        }
    };

    const handleMouseUp = async () => {
        if (!isSelecting) return;

        setIsSelecting(false);
        checkSelection();
        // 선택 박스 제거 - setSelectionBox(null) 호출 안 함

        // 선택 완료 상태를 Firebase에 동기화 (selectingStates 제거)
        if (gameId.current) {
            try {
                // 선택 상태 동기화 제거 - 타이머 간섭 방지
                // 선택 영역 전송
                await set(ref(database, `games/${gameId.current}/selections/${playerId.current}`), selectedCells);
            } catch (error) {
                console.error('Firebase 선택 완료 상태 업데이트 오류:', error);
            }
        }
    };

    // 선택된 셀 업데이트 (줌/스케일 안전)
    const updateSelectedCells = (left, top, width, height) => {
        const cells = [];
        if (!gameBoardRef.current) return;
        
        const rect = gameBoardRef.current.getBoundingClientRect();
        const cellWidth = rect.width / BOARD_SIZE_X;
        const cellHeight = rect.height / BOARD_SIZE_Y;

        const startCol = Math.max(0, Math.floor(left / cellWidth));
        const endCol = Math.min(BOARD_SIZE_X - 1, Math.floor((left + width) / cellWidth));
        const startRow = Math.max(0, Math.floor(top / cellHeight));
        const endRow = Math.min(BOARD_SIZE_Y - 1, Math.floor((top + height) / cellHeight));

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (gameBoard[row] && gameBoard[row][col] !== 0) {
                    cells.push({ row, col });
                }
            }
        }

        setSelectedCells(cells);
    };    // 선택 확인
    const checkSelection = async () => {
        if (selectedCells.length === 0) return;

        const sum = selectedCells.reduce((total, { row, col }) => total + gameBoard[row][col], 0);
        console.log('Checking selection:', selectedCells, 'sum:', sum);

        if (sum === TARGET_SUM) {
            // 성공 처리
            createPopSound();
            const newScore = score + selectedCells.length;
            setScore(newScore);
            console.log('Selection successful! New score:', newScore);

            // 보드 업데이트
            const newBoard = [...gameBoard];
            selectedCells.forEach(({ row, col }) => {
                newBoard[row][col] = 0;
            });
            setGameBoard(newBoard);

            // Firebase에 업데이트
            if (gameId.current) {
                try {
                    console.log('Updating Firebase with new board and score');
                    await set(ref(database, `games/${gameId.current}/gameBoard`), newBoard);
                    await set(ref(database, `games/${gameId.current}/scores/${playerId.current}`), newScore);
                    // 선택 상태 해제 제거 - selectingStates 사용 안 함
                    console.log('Firebase update completed');
                } catch (error) {
                    console.error('게임 데이터 업데이트 오류:', error);
                }
            }

            // 해결책이 없으면 게임 종료
            if (!hasSolution(newBoard)) {
                setTimeout(endGame, 500);
            }
        } else {
            console.log('Selection failed - sum is not', TARGET_SUM);
        }

        setSelectedCells([]);
    };

    // 컴포넌트 마운트/언마운트 시 처리
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
                <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px' }}>
                    뒤로가기
                </button>
            </div>
        </div>
    );

    // 게임 화면 렌더링
    const renderGame = () => (
        <div className="partner-game-container">
            <div className="partner-header">
                <div className="partner-title">사과 상자 게임 - 협동모드</div>
                <div className="partner-score-display">
                    <div className="total-score-section">
                        <span className="total-label">총 점수</span>
                        <span className="total-value">{(score || 0) + (partnerScore || 0)}</span>
                    </div>
                    <div className="players-scores">
                        <div className="player-info player1">
                            <span className="player-dot">●</span>
                            <span className="player-label">{playerName || '플레이어1'}</span>
                            <span className="player-score-value">{score || 0}</span>
                        </div>
                        <div className="player-info player2">
                            <span className="player-dot">●</span>
                            <span className="player-label">{otherPlayerName || '플레이어2'}</span>
                            <span className="player-score-value">{partnerScore || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="partner-game-area">
                <div
                    className="partner-game-board"
                    ref={gameBoardRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => setIsSelecting(false)}
                    style={{
                        gridTemplateColumns: `repeat(${BOARD_SIZE_X}, 1fr)`,
                        gridTemplateRows: `repeat(${BOARD_SIZE_Y}, 1fr)`,
                        minHeight: `${BOARD_SIZE_Y * 45 + 30}px`, // 하단 행이 잘리지 않도록
                        overflow: 'visible'
                    }}
                >
                    {gameBoard.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`cell board-cell ${cell === 0 ? 'empty-cell' : 'apple-cell'} ${
                                    selectedCells.some(({ row, col }) => row === rowIndex && col === colIndex) ? 'selected' : ''
                                } ${
                                    partnerSelectedCells.some(({ row, col }) => row === rowIndex && col === colIndex) ? 'partner-selected' : ''
                                }`}
                                style={{
                                    gridColumn: colIndex + 1,
                                    gridRow: rowIndex + 1
                                }}
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

                    {/* 선택 박스 제거 - 드래그 영역 표시 불필요 */}
                </div>

                <div className="partner-timer-container">
                    <div className="partner-timer-display">
                        <span className="partner-timer-text">{formatTime(remainingTime)}</span>
                    </div>
                    <div
                        className="partner-timer-bar"
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
    );

    return (
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
