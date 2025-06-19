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
import ApplesSVG from '../../images/apples.svg';

const TimeAttackMode = ({ onBack }) => {
  // 게임 설정
  const BOARD_SIZE = 4; // 4x4 격자
  const TARGET_SUM = 10;
  const GAME_TIME = 60; // 1분 (초 단위)  // 게임 상태
  const [gameBoard, setGameBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [applesRemoved, setApplesRemoved] = useState(0);  const [noMoreMoves, setNoMoreMoves] = useState(false);
  const [showNoMovesPopup, setShowNoMovesPopup] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const gameBoardRef = useRef(null);
  const timerRef = useRef(null);
  const selectionBoxRef = useRef(null);
  const mouseIsDownRef = useRef(false);
  
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
  // 게임 보드 초기화
  const initializeBoard = useCallback(() => {
    const board = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      const row = [];
      for (let x = 0; x < BOARD_SIZE; x++) {
        row.push({
          id: `${x}-${y}`,
          value: Math.floor(Math.random() * 9) + 1,
          x: x,
          y: y,
          selected: false
        });
      }
      board.push(row);
    }
    setGameBoard(board);    // 초기 보드에서 가능한 움직임 체크
    setTimeout(() => {
      console.log('🎯 초기 보드 체크');
      checkForPossibleMoves(board);
    }, 100);
  }, []);

  // 게임 시작
  const startGame = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setApplesRemoved(0);
    setNoMoreMoves(false);
    setShowNoMovesPopup(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    initializeBoard();
    
    // 타이머 시작
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
      timerRef.current = timer;
  }, [initializeBoard]); // initializeBoard 의존성 추가
  // 10을 만들 수 있는 조합이 있는지 체크
  const checkForPossibleMoves = (board = gameBoard) => {
    if (board.length === 0) return;
    
    console.log('=== 보드 체크 시작 ===');
    console.log('현재 보드:', board.map(row => row.map(cell => cell.value)));
    
    let hasValidMoves = false;
    const validCombinations = [];
    
    // 2개 조합 체크
    for (let y1 = 0; y1 < BOARD_SIZE; y1++) {
      for (let x1 = 0; x1 < BOARD_SIZE; x1++) {
        for (let y2 = 0; y2 < BOARD_SIZE; y2++) {
          for (let x2 = 0; x2 < BOARD_SIZE; x2++) {
            if (x1 !== x2 || y1 !== y2) {
              const value1 = board[y1][x1].value;
              const value2 = board[y2][x2].value;
              const sum = value1 + value2;
              
              if (sum === TARGET_SUM) {
                hasValidMoves = true;
                validCombinations.push({
                  pos1: `(${x1},${y1})`,
                  pos2: `(${x2},${y2})`,
                  values: `${value1}+${value2}=${sum}`
                });
              }
            }
          }
          if (hasValidMoves) break;
        }
        if (hasValidMoves) break;
      }
      if (hasValidMoves) break;
    }
    
    console.log('찾은 유효한 조합들:', validCombinations);
    console.log('유효한 움직임 있음:', hasValidMoves);
    
    if (!hasValidMoves) {
      console.log('❌ 더 이상 움직일 수 없습니다! 팝업을 띄웁니다.');
      setNoMoreMoves(true);
      setShowNoMovesPopup(true);
    }
  };// 게임 재시작
  const restartGame = () => {
    startGame();
  };
  // 팝업 닫기
  const closeNoMovesPopup = () => {
    setShowNoMovesPopup(false);
    setNoMoreMoves(false);
    
    // 새로운 보드 생성
    setGameBoard(prevBoard => {
      const newBoard = prevBoard.map(row => 
        row.map(cell => ({
          ...cell,
          value: Math.floor(Math.random() * 9) + 1,
          selected: false
        }))
      );
        // 새 보드에서 가능한 움직임 체크
      setTimeout(() => {
        console.log('🔄 팝업 닫은 후 새 보드 체크');
        checkForPossibleMoves(newBoard);
      }, 100);
      
      return newBoard;
    });
  };

  // 전역 마우스 업 이벤트 핸들러
  const handleGlobalMouseUp = useCallback(() => {
    if (mouseIsDownRef.current) {
      cleanupSelection();
    }
  }, []);
  // 컴포넌트 마운트 시 게임 시작
  useEffect(() => {
    startGame();
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('contextmenu', preventContextMenu);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('contextmenu', preventContextMenu);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // 빈 배열로 변경 - 컴포넌트 마운트시에만 실행

  // 선택 상자 생성
  const createSelectionBox = (x, y) => {
    const existingBox = document.querySelector('.selection-box');
    if (existingBox) {
      existingBox.remove();
    }

    const selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    selectionBox.style.position = 'absolute';
    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.border = '2px dashed #66BE6E';
    selectionBox.style.backgroundColor = 'rgba(102, 190, 110, 0.1)';
    selectionBox.style.pointerEvents = 'none';
    selectionBox.style.zIndex = '10';

    if (gameBoardRef.current) {
      gameBoardRef.current.appendChild(selectionBox);
      selectionBoxRef.current = selectionBox;
    }
  };

  // 선택 상자 업데이트
  const updateSelectionBox = (startX, startY, endX, endY) => {
    if (!selectionBoxRef.current) return;

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    selectionBoxRef.current.style.left = `${left}px`;
    selectionBoxRef.current.style.top = `${top}px`;
    selectionBoxRef.current.style.width = `${width}px`;
    selectionBoxRef.current.style.height = `${height}px`;
  };  // 마우스 다운 이벤트
  const handleMouseDown = (e) => {
    if (e.button === 2 || gameOver) return;
    
    mouseIsDownRef.current = true;
    
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    setIsSelecting(true);
    setSelectedCells([]);
    setStartPos({ x, y });
    
    createSelectionBox(x, y);
  };

  // 마우스 이동 이벤트
  const handleMouseMove = (e) => {
    if (!isSelecting || !mouseIsDownRef.current) return;
    
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    updateSelectionBox(startPos.x, startPos.y, x, y);
    
    // 선택된 셀들 찾기
    const cells = document.querySelectorAll('[data-cell-id]');
    const selectedCellsData = [];
    
    const selectionLeft = Math.min(startPos.x, x);
    const selectionTop = Math.min(startPos.y, y);
    const selectionRight = Math.max(startPos.x, x);
    const selectionBottom = Math.max(startPos.y, y);
      cells.forEach(cell => {
      const cellRect = cell.getBoundingClientRect();
      const boardRect = gameBoardRef.current.getBoundingClientRect();
      
      const cellLeft = cellRect.left - boardRect.left;
      const cellTop = cellRect.top - boardRect.top;
      const cellRight = cellLeft + cellRect.width;
      const cellBottom = cellTop + cellRect.height;
      
      if (cellLeft < selectionRight && cellRight > selectionLeft &&
          cellTop < selectionBottom && cellBottom > selectionTop) {
        
        const cellId = cell.dataset.cellId;
        const boardCell = gameBoard.flat().find(c => c.id === cellId);
        if (boardCell) {
          selectedCellsData.push(boardCell);
        }
      }    });
    
    setSelectedCells(selectedCellsData);
  };

  // 마우스 업 이벤트
  const handleMouseUp = (e) => {
    if (!isSelecting) return;
    
    checkSelection();
    cleanupSelection();
  };

  // 마우스 리브 이벤트
  const handleMouseLeave = (e) => {
    if (isSelecting) {
      handleMouseUp(e);
    }
  };  // 선택 검사
  const checkSelection = () => {
    if (selectedCells.length < 2) return;
    
    const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
    
    if (sum === TARGET_SUM) {
      setScore(prevScore => prevScore + selectedCells.length);
      
      // 애니메이션 효과
      selectedCells.forEach(cell => {
        const cellElement = document.querySelector(`[data-cell-id="${cell.id}"] .apple-image`);
        if (cellElement) {
          cellElement.classList.add('apple-explode');
        }
      });

      // 애니메이션이 끝나면 새로운 사과로 교체
      setTimeout(() => {
        setGameBoard(prevBoard => {
          const newBoard = prevBoard.map(row => [...row]);
          
          // 선택된 셀들에 새로운 랜덤 값 할당
          selectedCells.forEach(cell => {
            const [x, y] = cell.id.split('-').map(Number);
            if (newBoard[y] && newBoard[y][x]) {
              // 새로운 랜덤 사과 값 생성
              newBoard[y][x] = {
                ...newBoard[y][x],
                value: Math.floor(Math.random() * 9) + 1,
                selected: false
              };
            }
          });
          
          return newBoard;
        });
        
        // 애니메이션 클래스 제거
        selectedCells.forEach(cell => {
          const cellElement = document.querySelector(`[data-cell-id="${cell.id}"] .apple-image`);
          if (cellElement) {
            cellElement.classList.remove('apple-explode');
          }
        });
          // 새 보드에서 가능한 움직임 체크
        setTimeout(() => {
          console.log('🍎 사과 제거 후 보드 체크');
          checkForPossibleMoves();
        }, 100);
        
      }, 250);
      
      setApplesRemoved(prev => prev + selectedCells.length);
    }
    
    setSelectedCells([]);
  };
  // 선택 정리
  const cleanupSelection = () => {
    setIsSelecting(false);
    setSelectedCells([]);
    mouseIsDownRef.current = false;
    
    if (selectionBoxRef.current) {
      selectionBoxRef.current.remove();
      selectionBoxRef.current = null;
    }
  };

  // 드래그 관련 함수들
  const preventDrag = (e) => {
    e.preventDefault();
    return false;
  };

  const preventContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  return (
    <div className="classic-container">
      {/* 상단 UI */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%', 
        maxWidth: '800px',
        marginBottom: '30px',
        padding: '0 20px',
        backgroundcolor: ''
      }}>
        <h2 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#333',
          margin: 0
        }}>
          Time Attack
        </h2>
        
        <div style={{
          width: '400px',
          height: '20px',
          backgroundColor: '#E0E0E0',
          borderRadius: '10px',
          overflow: 'hidden',
          margin: '0 20px'
        }}>
          <div style={{
            width: `${(timeLeft / GAME_TIME) * 100}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            transition: 'width 1s ease'
          }}></div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img 
            src={ApplesSVG} 
            alt="score" 
            style={{ width: '30px', height: '30px' }}
          />
          <span style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {score}
          </span>
        </div>
      </div>      {/* 게임 보드 */}
      <div 
        ref={gameBoardRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDragStart={preventDrag}
        onContextMenu={preventContextMenu}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '8px',
          width: '400px',
          height: '400px',
          backgroundColor: '#F2FDEF',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          marginBottom: '30px',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        {gameBoard.flat().map((cell) => (
          <div
            key={cell.id}
            data-cell-id={cell.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: '12px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              border: selectedCells.some(selected => selected.id === cell.id) ? '3px solid #66BE6E' : '2px solid transparent'
            }}
          >            <img 
              src={appleImages[cell.value] || appleImages.default} 
              alt={`Apple ${cell.value}`} 
              className="apple-image" 
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                pointerEvents: 'none'
              }}
            />
          </div>
        ))}
      </div>

      {/* 하단 버튼들 */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <button 
          onClick={restartGame}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
        >
          재시작
        </button>
        <button 
          onClick={onBack}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#FF6B6B',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
        >
          메인으로
        </button>      </div>

      {/* 더 이상 움직일 수 없을 때 팝업 */}
      {showNoMovesPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '20px',
            textAlign: 'center',
            maxWidth: '350px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ 
              margin: 0, 
              marginBottom: '20px',
              color: '#FF6B6B',
              fontSize: '24px'
            }}>
              ⚠️ 더 이상 움직일 수 없습니다!
            </h2>
            <p style={{ 
              fontSize: '16px', 
              margin: '10px 0',
              color: '#666',
              lineHeight: '1.5'
            }}>
              10을 만들 수 있는 조합이 없습니다.<br/>
              새로운 사과들이 생성됩니다.
            </p>
            <button 
              onClick={closeNoMovesPopup}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                marginTop: '15px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 게임 오버 오버레이 */}
      {gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <h2 style={{ margin: 0, marginBottom: '20px' }}>
              {noMoreMoves ? '더 이상 움직일 수 없습니다!' : '시간 종료!'}
            </h2>
            <p style={{ fontSize: '18px', margin: '10px 0' }}>최종 점수: {score}</p>
            <p style={{ fontSize: '18px', margin: '10px 0' }}>제거한 사과: {applesRemoved}개</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={restartGame} className="back-button">재시작</button>
              <button onClick={onBack} className="back-button">끝내기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeAttackMode;
