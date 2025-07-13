import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import AppleSVG from '../../images/apples.svg';
import AuthService from '../../utils/auth';
import ScoreService from '../../utils/scoreService';
import Rankings from '../Rankings/Rankings';
import Login from '../Login/Login';

const ClassicMode = ({ onBack, onScoreSubmitted, onShowRankings }) => {
  // 게임 설정
  const BOARD_SIZE_X = 15; // 가로 칸 수
  const BOARD_SIZE_Y = 10; // 세로 칸 수
  const TARGET_SUM = 10;
  const GAME_TIME = 120; // 2분 (초 단위)
    // 게임 상태
  const [gameBoard, setGameBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [applesRemoved, setApplesRemoved] = useState(0);
  const [showRanking, setShowRanking] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const gameBoardRef = useRef(null);
  const selectionBoxRef = useRef(null);
  const mouseIsDownRef = useRef(false); // 마우스 버튼 상태를 추적하는 ref
  const timerRef = useRef(null);
  const scoreRef = useRef(0);
  const applesRemovedRef = useRef(0);
  const gameStartTimeRef = useRef(null);
  
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
  
  // 드래그 방지 함수들
  const preventDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  
  const preventContextMenu = (e) => {
    e.preventDefault();
    return false;
  };  const handleRankingClick = () => {
    setShowRanking(true);
  };

  // 랭킹 팝업 닫기
  const handleCloseRanking = () => {
    setShowRanking(false);
  };
    // 전역 마우스 업 이벤트 핸들러
  const handleGlobalMouseUp = useCallback((e) => {
    mouseIsDownRef.current = false;
    
    if (isSelecting) {
      handleMouseUp(e);
    }  }, [isSelecting]);
  // 초기화
  useEffect(() => {
    // 인증 상태 확인
    AuthService.getCurrentUser();
    
    // 인증 상태 변경 리스너 등록
    const unsubscribe = AuthService.addListener((user) => {
      // 인증 상태 변경 시 필요한 처리가 있다면 여기에 추가
      console.log('User authentication changed:', user);
    });

    // 게임 초기화 (한 번만 실행)
    initGame();
    
    // 전역 이벤트 리스너 추가
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('contextmenu', preventContextMenu);
    
    return () => {
      unsubscribe();
      // 전역 이벤트 리스너 제거
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('contextmenu', preventContextMenu);
      
      // 타이머 정리
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // 빈 의존성 배열로 한 번만 실행  // 랜덤 숫자 생성 (1~9)
  const getRandomAppleValue = () => {
    return Math.floor(Math.random() * 9) + 1;
  };

  // 게임 보드 생성
  const generateBoard = () => {
    console.log('generateBoard 호출됨');
    // 10x15 배열 생성 (세로 10줄, 가로 15칸)
    const newBoard = Array(BOARD_SIZE_Y).fill().map(() => 
      Array(BOARD_SIZE_X).fill().map(() => ({
        value: getRandomAppleValue(),
        isVisible: true
      }))
    );
    
    console.log('새 보드 생성:', newBoard.length, 'x', newBoard[0]?.length);
    setGameBoard(newBoard);
  };

  const initGame = () => {
    console.log('initGame 호출됨');
    setScore(0);
    scoreRef.current = 0;
    setSelectedCells([]);
    setGameOver(false);
    setTimeLeft(GAME_TIME);
    setApplesRemoved(0);
    applesRemovedRef.current = 0;
    gameStartTimeRef.current = Date.now();
    setScoreSubmitted(false);
    
    // 기존 타이머 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // 타이머 시작
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleGameEnd();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    generateBoard();
  };  // 게임 종료 처리
  const handleGameEnd = async () => {
    setGameOver(true);
    // ref에서 최신 값 가져오기
    const currentScore = scoreRef.current;
    const currentApplesRemoved = applesRemovedRef.current;
    const currentGameStartTime = gameStartTimeRef.current;
    
    // 최신 로그인 상태 다시 확인
    const latestUser = AuthService.getCurrentUser();
    console.log('게임 종료 시 로그인 상태:', latestUser);
    console.log('점수 제출 상태:', { scoreSubmitted, currentScore });
    console.log('조건 확인:', { 
      hasUser: !!latestUser, 
      scoreGreaterThanZero: currentScore > 0,
      shouldSubmit: latestUser && currentScore > 0,
      currentScore: currentScore,
      userPlayerName: latestUser?.playerName
    });
    
    // 로그인된 사용자이고 점수가 0보다 크면 점수 제출
    if (latestUser && currentScore > 0) {
      console.log('✅ 점수 제출 조건 만족 - 점수 제출 시작');
      
      // 📊 점수 제출 전 현재 랭킹 상태 저장
      let previousRankings = null;
      let userPreviousRank = null;
      let userPreviousScore = null;
      
      try {
        console.log('🔍 점수 제출 전 랭킹 조회 시작...');
        const beforeData = await ScoreService.getRankings('classic', 50);
        if (beforeData && beforeData.rankings) {
          previousRankings = beforeData.rankings;
          // 현재 사용자의 기존 기록 찾기
          const userRecord = previousRankings.find(r => r.playerName === latestUser.playerName);
          if (userRecord) {
            userPreviousRank = previousRankings.indexOf(userRecord) + 1;
            userPreviousScore = userRecord.score;
            console.log(`📈 ${latestUser.playerName}의 기존 기록: ${userPreviousRank}위 (${userPreviousScore}점)`);
          } else {
            console.log(`🆕 ${latestUser.playerName}은 첫 기록입니다`);
          }
        }
      } catch (error) {
        console.error('점수 제출 전 랭킹 조회 실패:', error);
      }
      
      try {
        const playTime = Math.floor((Date.now() - currentGameStartTime) / 1000);
        console.log('점수 제출 시도:', { 
          currentScore, 
          playTime, 
          currentApplesRemoved, 
          user: latestUser.playerName,
          isAuthenticated: AuthService.isAuthenticated()
        });
        
        const result = await ScoreService.submitScore({
          score: currentScore,
          mode: 'classic',
          playTime: playTime,
          applesRemoved: currentApplesRemoved
        });
        
        console.log('📤 점수 제출 성공:', result);
        console.log('📤 제출한 점수:', currentScore);
        console.log('📤 서버 응답 결과:', {
          success: result.success,
          rank: result.rank,
          personalBest: result.personalBest,
          message: result.message
        });
        setScoreSubmitted(true);
        
        // 📊 점수 제출 후 랭킹 비교 및 재시도 로직
        setTimeout(async () => {
          try {
            console.log('🔍 점수 제출 후 랭킹 조회 시작... (3초 대기 후)');
            const afterData = await ScoreService.getRankings('classic', 50);
            if (afterData && afterData.rankings) {
              const newRankings = afterData.rankings;
              const userNewRecord = newRankings.find(r => r.playerName === latestUser.playerName);
              
              console.log('🔍 서버에서 받은 사용자 기록:', userNewRecord);
              console.log('🎯 실제 게임 점수:', currentScore);
              
              if (userNewRecord) {
                const userNewRank = newRankings.indexOf(userNewRecord) + 1;
                const userNewScore = userNewRecord.score;
                
                console.log('═══════════════════════════════════');
                console.log('🏆 랭킹 변화 분석 결과');
                console.log('═══════════════════════════════════');
                console.log(`👤 플레이어: ${latestUser.playerName}`);
                console.log(`🎯 이번 게임 점수: ${currentScore}점`);
                console.log(`🗄️ 서버 저장된 점수: ${userNewScore}점`);
                
                // 점수 불일치 확인 및 재시도
                if (currentScore !== userNewScore) {
                  console.log('🚨🚨🚨 점수 불일치 발견! 🚨🚨🚨');
                  console.log(`❌ 게임 점수: ${currentScore}점`);
                  console.log(`❌ 서버 점수: ${userNewScore}점`);
                  console.log('🔧 점수 재제출을 시도합니다...');
                  
                  // 점수 재제출 시도
                  try {
                    console.log('🔄 점수 재제출 시작...');
                    const retryResult = await ScoreService.submitScore({
                      score: currentScore,
                      mode: 'classic',
                      playTime: playTime,
                      applesRemoved: currentApplesRemoved
                    });
                    console.log('🔄 점수 재제출 결과:', retryResult);
                    
                    // 재제출 후 다시 확인
                    setTimeout(async () => {
                      try {
                        console.log('🔍 재제출 후 랭킹 재확인...');
                        const retryAfterData = await ScoreService.getRankings('classic', 50);
                        if (retryAfterData && retryAfterData.rankings) {
                          const retryUserRecord = retryAfterData.rankings.find(r => r.playerName === latestUser.playerName);
                          if (retryUserRecord && retryUserRecord.score === currentScore) {
                            console.log('✅ 재제출 성공! 점수가 정확히 업데이트되었습니다!');
                            console.log(`✅ 최종 점수: ${retryUserRecord.score}점`);
                            
                            // 랭킹 새로고침 트리거
                            if (onScoreSubmitted) {
                              onScoreSubmitted();
                            }
                          } else {
                            console.log('❌ 재제출 후에도 점수가 맞지 않습니다.');
                            console.log('🔧 서버 측 문제일 가능성이 높습니다.');
                          }
                        }
                      } catch (error) {
                        console.error('재제출 후 확인 실패:', error);
                      }
                    }, 2000);
                    
                  } catch (retryError) {
                    console.error('점수 재제출 실패:', retryError);
                  }
                } else {
                  console.log('✅ 점수가 정확히 업데이트되었습니다!');
                }
                
                if (userPreviousScore !== null) {
                  console.log(`📊 이전 기록: ${userPreviousRank}위 (${userPreviousScore}점)`);
                  console.log(`📊 새로운 기록: ${userNewRank}위 (${userNewScore}점)`);
                  
                  if (userNewScore > userPreviousScore) {
                    console.log(`🎉 점수 향상! ${userPreviousScore} → ${userNewScore} (+${userNewScore - userPreviousScore}점)`);
                  } else if (userNewScore < userPreviousScore) {
                    console.log(`📉 점수 하락: ${userPreviousScore} → ${userNewScore} (${userNewScore - userPreviousScore}점)`);
                  } else {
                    console.log(`⚖️ 점수 동일: ${userNewScore}점`);
                  }
                  
                  if (userNewRank < userPreviousRank) {
                    console.log(`🚀 순위 상승! ${userPreviousRank}위 → ${userNewRank}위 (${userPreviousRank - userNewRank}등 상승)`);
                  } else if (userNewRank > userPreviousRank) {
                    console.log(`📉 순위 하락: ${userPreviousRank}위 → ${userNewRank}위 (${userNewRank - userPreviousRank}등 하락)`);
                  } else {
                    console.log(`🔄 순위 유지: ${userNewRank}위`);
                  }
                } else {
                  console.log(`🆕 첫 기록 등록: ${userNewRank}위 (${userNewScore}점)`);
                }
                
                console.log('═══════════════════════════════════');
                
                // 전체 랭킹 변화도 확인
                if (previousRankings && previousRankings.length !== newRankings.length) {
                  console.log(`📈 전체 랭킹 수 변화: ${previousRankings.length} → ${newRankings.length}`);
                }
              } else {
                console.log('🚨 서버에서 사용자 기록을 찾을 수 없습니다!');
              }
            }
          } catch (error) {
            console.error('점수 제출 후 랭킹 비교 실패:', error);
          }
        }, 3000); // 3초 후 비교
        
        // 점수 제출 성공 시 랭킹 새로고침 트리거
        if (onScoreSubmitted) {
          onScoreSubmitted();
        }
        
        if (result.personalBest) {
          alert(`🎉 게임 종료!\n점수: ${currentScore.toLocaleString()}점\n🏆 개인 최고 기록 달성!\n순위: ${result.rank}위\n\n랭킹을 확인해보세요!`);
        } else {
          alert(`게임 종료!\n점수: ${currentScore.toLocaleString()}점\n순위: ${result.rank}위\n\n랭킹에 기록되었습니다!\n랭킹을 확인해보세요!`);        }
        
        // 잠시 후 랭킹 모달 자동 열기
        setTimeout(() => {
          if (onShowRankings) {
            onShowRankings();
          }
        }, 2000); // 2초 후 랭킹 모달 열기
        
        // 게임 종료 알림만 표시 (랭킹은 수동으로 확인)
        
      } catch (error) {
        console.error('점수 제출 실패:', error);
        // 점수 제출에 실패해도 게임 종료는 알림
        alert(`게임 종료!\n점수: ${currentScore.toLocaleString()}점\n\n⚠️ 점수 제출 실패: ${error.message}`);
      }
    } else if (!latestUser) {
      console.log('❌ 로그인하지 않음 - 점수 제출 안함');
      // 로그인하지 않은 경우
      alert(`게임 종료!\n점수: ${currentScore.toLocaleString()}점\n\n💡 로그인하면 랭킹에 기록됩니다!`);
    } else {
      console.log('❌ 점수가 0이거나 조건 불만족 - 점수 제출 안함', { currentScore, latestUser });
      // 점수가 0인 경우
      alert(`게임 종료!\n점수: ${currentScore.toLocaleString()}점`);
    }
  };  // 로그인 성공 처리
  const handleLoginSuccess = (user) => {
    setShowLogin(false);
    console.log('로그인 성공:', user);
  };

  // 로그인 모달 닫기
  const handleLoginClose = () => {
    setShowLogin(false);  };
  
  // 마우스 다운 이벤트
  const handleMouseDown = (e) => {
    // 우클릭 무시
    if (e.button === 2) return;
    
    if (gameOver) return;
    mouseIsDownRef.current = true;
    
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    setIsSelecting(true);
    setSelectedCells([]);
    setStartPos({ x, y });
    
    // 선택 상자 생성
    createSelectionBox(x, y);
    
    // 이벤트 전파 중지 (드래그를 위해 preventDefault 제거)
    e.stopPropagation();
  };
  
  // 마우스 이동 이벤트
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
  };
  
  // 선택 상태 완전 정리
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
  };
  
  // 마우스 업 이벤트
  const handleMouseUp = (e) => {
    if (!isSelecting) return;
    
    checkSelection();
    cleanupSelection();
    
    // 텍스트 선택 방지
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  // 마우스 리브 이벤트
  const handleMouseLeave = (e) => {
    if (isSelecting) {
      handleMouseUp(e);
    }
  };
  
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
    
    const { x: startX, y: startY } = startPos;
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
  };
    // 선택 검사
  const checkSelection = () => {
    if (selectedCells.length < 2) return;
    
    // 선택된 셀의 값 합계 계산
    const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
    console.log('선택된 셀:', selectedCells, '합계:', sum);      // 합계가 목표값과 일치하는지 확인
    if (sum === TARGET_SUM) {
      const newScore = score + selectedCells.length; // 사과 하나당 1점
      console.log('점수 업데이트:', score, '->', newScore);
      
      // 점수 추가
      setScore(newScore);
      scoreRef.current = newScore;
        // 애니메이션 효과를 위해 선택된 셀에 클래스 추가
      selectedCells.forEach(cell => {
        const cellElement = document.querySelector(`.board-cell[data-row="${cell.row}"][data-col="${cell.col}"] .apple-image`);
        if (cellElement) {
          // 펑 터지는 애니메이션 적용
          cellElement.classList.add('apple-explode');
        }
      });      // 애니메이션이 끝나면 모든 선택된 사과를 한 번에 제거
      setTimeout(() => {
        setGameBoard(prevBoard => {
          const newBoard = prevBoard.map(row => [...row]);
          selectedCells.forEach(cell => {
            newBoard[cell.row][cell.col].isVisible = false;
          });
          console.log('사과 제거 완료, 선택된 셀 개수:', selectedCells.length);
          return newBoard;
        });
      }, 250); // 애니메이션 시간과 맞춤 (0.25초)
      
      // 제거된 사과 개수 업데이트
      setApplesRemoved(prev => {
        const newCount = prev + selectedCells.length;
        console.log('사과 제거 개수 업데이트:', prev, '->', newCount);
        applesRemovedRef.current = newCount;
        return newCount;
      });
    }
    
    setSelectedCells([]);
  };

  // 타이머 진행률 계산 (0~100)
  const calculateTimeProgress = () => {
    return (timeLeft / GAME_TIME) * 100;
  };

  return (
    <div className="classic-mode-container classic-mode-container2">
      <div className="game-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="game-title">Classic Apple</h1>
          </div>
            <div className="header-center">
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${calculateTimeProgress()}%` }}
              ></div>
            </div>
          </div>
          
          <div className="header-right">
            {AuthService.isAuthenticated() ? (
              <div className="user-info">
                {/* <span className="player-name">{AuthService.getPlayerName()}</span> */}
                <div className="score-display1">
                  <img src={AppleDefault} width='20px'/><div>{score}</div></div>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="login-btn">
                로그인
              </button>
            )}
          </div>
        </div>
      </div>
        <div 
        ref={gameBoardRef} 
        className="game-board"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDragStart={preventDrag}
        onContextMenu={preventContextMenu}
      >
        {/* 게임 보드를 행과 열로 명확하게 렌더링 */}
        {Array.from({ length: BOARD_SIZE_Y }).map((_, rowIndex) => (
          Array.from({ length: BOARD_SIZE_X }).map((_, colIndex) => {
            const cell = gameBoard[rowIndex] && gameBoard[rowIndex][colIndex];
            if (!cell) return null;
            
            return (              <div 
                key={`${rowIndex}-${colIndex}`} 
                className={`board-cell ${cell.isVisible ? 'apple-cell' : 'empty-cell'}`}
                data-row={rowIndex}
                data-col={colIndex}
                data-value={cell.value}
                style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 1 }}
                draggable="false"
                onContextMenu={preventContextMenu}
                onDragStart={preventDrag}
              >                {cell.isVisible && (
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
      <button onClick={onBack} className="back-button">
        돌아가기
      </button>
        {/* 랭킹 버튼 */}
      <button className="ranking-button" onClick={handleRankingClick}>
        <span className="trophy-icon">🏆</span>
      </button>      {/* 로그인 모달 */}
      {showLogin && (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onClose={handleLoginClose}
        />
      )}      {/* 랭킹 팝업 모달 */}
      {showRanking && (
        <div>
          <div>
            {/* <div className="ranking-modal-header">
              <h2>🏆 랭킹</h2>
              <button onClick={handleCloseRanking} className="close-button">
                ×
              </button>
            </div> */}
            <Rankings onBack={handleCloseRanking} isModal={true} isOpen={showRanking} gameMode="classic" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassicMode;