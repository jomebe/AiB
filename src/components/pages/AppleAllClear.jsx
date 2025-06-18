import React, { useState, useEffect, useRef } from 'react';
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

const AppleAllClear = ({ onBack }) => {
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
  const [allClear, setAllClear] = useState(false);
  
  const gameBoardRef = useRef(null);
  const selectionBoxRef = useRef(null);
  const mouseIsDownRef = useRef(false); // 마우스 버튼 상태를 추적하는 ref
  const timerRef = useRef(null);
  
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

  // 랜덤 사과 값 생성 (1-9)
  const generateRandomApple = () => {
    return Math.floor(Math.random() * 9) + 1;
  };

  // 게임 보드 초기화
  const initializeBoard = () => {
    const newBoard = [];
    for (let y = 0; y < BOARD_SIZE_Y; y++) {
      const row = [];
      for (let x = 0; x < BOARD_SIZE_X; x++) {
        row.push(generateRandomApple());
      }
      newBoard.push(row);
    }
    setGameBoard(newBoard);
  };
  // 게임 초기화
  const initGame = () => {
    setScore(0);
    setSelectedCells([]);
    setGameOver(false);
    setTimeLeft(GAME_TIME);
    setApplesRemoved(0);
    setAllClear(false);
    
    // 기존 타이머 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // 타이머 시작
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          setGameOver(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // 게임 보드 새로 생성
    generateBoard();
  };
  
  // 랜덤 숫자 생성 (1~9)
  const getRandomAppleValue = () => {
    return Math.floor(Math.random() * 9) + 1;
  };
  
  // 게임 보드 생성
  const generateBoard = () => {
    // 10x15 배열 생성 (세로 10줄, 가로 15칸)
    const newBoard = Array(BOARD_SIZE_Y).fill().map(() => 
      Array(BOARD_SIZE_X).fill().map(() => getRandomAppleValue())
    );
    
    setGameBoard(newBoard);
  };

  // 선택된 영역의 합계 계산
  const calculateSelectedSum = () => {
    return selectedCells.reduce((sum, cell) => {
      const value = gameBoard[cell.y]?.[cell.x] || 0;
      return sum + value;
    }, 0);
  };

  // 사과 제거 및 점수 추가
  const removeSelectedApples = () => {
    const sum = calculateSelectedSum();
    if (sum === TARGET_SUM && selectedCells.length >= 2) {
      const newBoard = [...gameBoard];
      
      // 선택된 사과들을 0으로 설정
      selectedCells.forEach(cell => {
        if (newBoard[cell.y]?.[cell.x]) {
          newBoard[cell.y][cell.x] = 0;
        }
      });
      
      setGameBoard(newBoard);
      setScore(prev => prev + selectedCells.length * 10);
      setApplesRemoved(prev => prev + selectedCells.length);
      
      // 모든 사과가 제거되었는지 확인
      const remainingApples = newBoard.flat().filter(cell => cell > 0);
      if (remainingApples.length === 0) {
        setAllClear(true);
        setGameOver(true);
        clearInterval(timerRef.current);
      }
      
      return true;
    }
    return false;
  };
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
    
    // 텍스트 선택 방지
    e.preventDefault();
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

  // 선택된 셀들 업데이트
  const updateSelectedCells = () => {
    if (!selectionBoxRef.current) return;
    
    const selectionRect = selectionBoxRef.current.getBoundingClientRect();
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    
    const relativeRect = {
      left: selectionRect.left - boardRect.left,
      top: selectionRect.top - boardRect.top,
      right: selectionRect.right - boardRect.left,
      bottom: selectionRect.bottom - boardRect.top
    };
    
    const newSelectedCells = [];
    
    // 모든 셀에서 선택 클래스 제거
    document.querySelectorAll('.apple-cell').forEach(cell => {
      cell.classList.remove('selected');
    });
    
    // 각 셀이 선택 영역과 겹치는지 확인
    gameBoard.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 0) return; // 빈 셀은 제외
        
        const cellLeft = 83 + colIndex * 49;
        const cellTop = 55 + rowIndex * 49;
        const cellRight = cellLeft + 48;
        const cellBottom = cellTop + 48;
        
        // 겹침 검사
        if (cellLeft < relativeRect.right && cellRight > relativeRect.left &&
            cellTop < relativeRect.bottom && cellBottom > relativeRect.top) {
          
          newSelectedCells.push({ x: colIndex, y: rowIndex });
          
          // DOM에서 해당 셀에 selected 클래스 추가
          const cellElement = document.querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`);
          if (cellElement) {
            cellElement.classList.add('selected');
          }
        }
      });
    });
    
    setSelectedCells(newSelectedCells);
  };

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      mouseIsDownRef.current = false;
      setIsSelecting(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);
  // 컴포넌트 마운트 시 게임 시작
  useEffect(() => {
    initGame();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 선택 검사
  const checkSelection = () => {
    if (selectedCells.length < 2) return;
    
    // 선택된 셀의 값 합계 계산
    const sum = selectedCells.reduce((total, cell) => {
      const cellValue = gameBoard[cell.y] && gameBoard[cell.y][cell.x];
      return total + (cellValue || 0);
    }, 0);
    
    if (sum === TARGET_SUM) {
      // 성공적인 선택
      const newBoard = [...gameBoard];
      let removedCount = 0;
      
      selectedCells.forEach(({ x, y }) => {
        if (newBoard[y] && newBoard[y][x] > 0) {
          newBoard[y][x] = 0; // 사과 제거
          removedCount++;
        }
      });
      
      setGameBoard(newBoard);
      setScore(prevScore => prevScore + selectedCells.length * 10);
      setApplesRemoved(prevCount => prevCount + removedCount);
      
      // 모든 사과가 제거되었는지 확인
      const hasApples = newBoard.some(row => row.some(cell => cell > 0));
      if (!hasApples) {
        setAllClear(true);
        setGameOver(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  // 드래그 방지 함수들
  const preventDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const preventContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div className="classic-mode-container">
      <div className="game-header">
        <div className="header-content">
          <div className="game-title">Apple All Clear</div>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
            ></div>
          </div>
          <div className="apple-score-container">
            <img src={AppleSVG} alt="Apple" className="apple-icon" />
            <span className="apple-count">{applesRemoved}</span>
          </div>
        </div>
        <div className="time-display">Time: {formatTime(timeLeft)}</div>
      </div>      <div 
        ref={gameBoardRef} 
        className="game-board"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDragStart={preventDrag}
        onContextMenu={preventContextMenu}
      >{/* 게임 보드를 행과 열로 명확하게 렌더링 */}
        {Array.from({ length: BOARD_SIZE_Y }).map((_, rowIndex) => (
          Array.from({ length: BOARD_SIZE_X }).map((_, colIndex) => {
            const cell = gameBoard[rowIndex] && gameBoard[rowIndex][colIndex];
            if (!cell) return null;
            
            const isSelected = selectedCells.some(selected => selected.x === colIndex && selected.y === rowIndex);
            const isEmpty = cell === 0;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`board-cell ${isEmpty ? 'empty-cell' : 'apple-cell'} ${isSelected ? 'selected' : ''}`}
                data-row={rowIndex}
                data-col={colIndex}
                data-value={cell}
                style={{ 
                  left: `${83 + colIndex * 49}px`, 
                  top: `${55 + rowIndex * 49}px` 
                }}
              >
                {!isEmpty && (
                  <img
                    src={appleImages[cell] || appleImages.default}
                    alt={`Apple ${cell}`}
                    className="apple-image"
                    draggable={false}
                  />
                )}
              </div>
            );
          })
        ))}
        
        {/* 선택 박스 표시 */}
        {isSelecting && selectedCells.length > 0 && (
          <div className="selection-box">
            선택된 합: {calculateSelectedSum()} / {TARGET_SUM}
          </div>
        )}
      </div>

      {/* 게임 오버 화면 */}
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>{allClear ? '🎉 All Clear! 🎉' : '⏰ Time Up!'}</h2>
            <p>Score: {score}</p>
            <p>Apples Removed: {applesRemoved}</p>
            <div className="game-over-buttons">
              <button onClick={initGame}>다시하기</button>
              <button onClick={onBack}>뒤로가기</button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div className="game-controls">
        <button onClick={initGame} className="control-button">
          새 게임
        </button>
        <button onClick={onBack} className="control-button">
          뒤로가기
        </button>
        <div className="score-display">
          Score: {score}
        </div>
      </div>
    </div>
  );
};

export default AppleAllClear;
