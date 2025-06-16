import React, { useState, useEffect, useRef } from 'react';
import '../styles/ClassicMode.css';
import AppleDefault from '../../images/appleDefault.svg';
import GoldenApple from '../../images/goldenapple.svg';
import GoldenApple1 from '../../images/goldenapple1.svg';
import GoldenApple2 from '../../images/goldenapple2.svg';
import GoldenApple3 from '../../images/goldenapple3.svg';
import GoldenApple4 from '../../images/goldenapple4.svg';
import GoldenApple5 from '../../images/goldenapple5.svg';
import GoldenApple6 from '../../images/goldenapple6.svg';
import GoldenApple7 from '../../images/goldenapple7.svg';
import GoldenApple8 from '../../images/goldenapple8.svg';
import GoldenApple9 from '../../images/goldenapple9.svg';
import BugApple from '../../images/bugapple.svg';
import RainbowApple from '../../images/rainbowapple.svg';
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

const GoldenAppleMode = ({ onBack }) => {
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
  
  const gameBoardRef = useRef(null);
  const selectionBoxRef = useRef(null);
  const mouseIsDownRef = useRef(false);
  const timerRef = useRef(null);

  // 일반 사과 이미지 매핑
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
  // 황금 사과 이미지 매핑
  const goldenAppleImages = {
    1: GoldenApple1,
    2: GoldenApple2,
    3: GoldenApple3,
    4: GoldenApple4,
    5: GoldenApple5,
    6: GoldenApple6,
    7: GoldenApple7,
    8: GoldenApple8,
    9: GoldenApple9
  };

  // 게임 보드 초기화
  const initializeBoard = () => {
    const board = [];
    let goldenAppleCount = 0;
    let bugAppleCount = 0;
    let rainbowAppleCount = 0;
    
    for (let y = 0; y < BOARD_SIZE_Y; y++) {
      const row = [];
      for (let x = 0; x < BOARD_SIZE_X; x++) {
        let cellType = 'normal';
        let value = Math.floor(Math.random() * 9) + 1;
        
        // 황금사과 5개 배치 (확률적으로)
        if (goldenAppleCount < 5 && Math.random() < 0.05) {
          cellType = 'golden';
          goldenAppleCount++;
        }
        // 썩은사과 3개 배치
        else if (bugAppleCount < 3 && Math.random() < 0.03) {
          cellType = 'bug';
          value = 0; // 썩은사과는 값이 없음
        }
        // 무지개사과 2개 배치
        else if (rainbowAppleCount < 2 && Math.random() < 0.02) {
          cellType = 'rainbow';
          value = 0; // 무지개사과는 합칠 때 결정됨
        }
        
        row.push({
          id: `${x}-${y}`,
          value: value,
          type: cellType,
          row: y,
          col: x,
          isVisible: true
        });
      }
      board.push(row);
    }
    
    // 남은 특수 사과들을 랜덤 위치에 강제 배치
    while (goldenAppleCount < 5) {
      const x = Math.floor(Math.random() * BOARD_SIZE_X);
      const y = Math.floor(Math.random() * BOARD_SIZE_Y);
      if (board[y][x].type === 'normal') {
        board[y][x].type = 'golden';
        goldenAppleCount++;
      }
    }
    
    while (bugAppleCount < 3) {
      const x = Math.floor(Math.random() * BOARD_SIZE_X);
      const y = Math.floor(Math.random() * BOARD_SIZE_Y);
      if (board[y][x].type === 'normal') {
        board[y][x].type = 'bug';
        board[y][x].value = 0;
        bugAppleCount++;
      }
    }
    
    while (rainbowAppleCount < 2) {
      const x = Math.floor(Math.random() * BOARD_SIZE_X);
      const y = Math.floor(Math.random() * BOARD_SIZE_Y);
      if (board[y][x].type === 'normal') {
        board[y][x].type = 'rainbow';
        board[y][x].value = 0;
        rainbowAppleCount++;
      }
    }
    
    setGameBoard(board);
  };

  // 게임 보드에서 사과 이미지 가져오기
  const getAppleImage = (cell) => {
    switch (cell.type) {
      case 'golden':
        return goldenAppleImages[cell.value] || GoldenApple1;
      case 'bug':
        return BugApple;
      case 'rainbow':
        return RainbowApple;
      default:
        return appleImages[cell.value] || appleImages.default;
    }
  };
  // 선택된 셀들의 합 계산 (개선된 무지개 사과 처리)
  const calculateSelectionSum = (cells) => {
    let sum = 0;
    let rainbowCount = 0;
    let hasBug = false;
    let normalSum = 0;
    
    cells.forEach(cell => {
      if (cell.type === 'bug') {
        hasBug = true;
      } else if (cell.type === 'rainbow') {
        rainbowCount++;
      } else {
        normalSum += cell.value;
      }
    });
    
    // 썩은 사과가 포함되면 조합 불가
    if (hasBug) {
      return -1;
    }
    
    // 무지개 사과가 포함된 경우
    if (rainbowCount > 0) {
      // 각 무지개 사과가 필요한 값을 계산
      let remainingTarget = TARGET_SUM - normalSum;
      
      // 무지개 사과가 여러개인 경우 균등 분배
      if (rainbowCount === 1) {
        if (remainingTarget >= 1 && remainingTarget <= 9) {
          return TARGET_SUM;
        }
      } else if (rainbowCount === 2) {
        // 두 무지개 사과로 나머지를 만들 수 있는지 확인
        for (let i = 1; i <= 9; i++) {
          for (let j = 1; j <= 9; j++) {
            if (i + j === remainingTarget) {
              return TARGET_SUM;
            }
          }
        }
      }
      return normalSum; // 적절한 값으로 맞출 수 없음
    }
    
    return normalSum;
  };

  // 점수 계산
  const calculateScore = (cells) => {
    let baseScore = cells.length;
    let goldenAppleCount = 0;
    
    cells.forEach(cell => {
      if (cell.type === 'golden') {
        goldenAppleCount++;
      }
    });
    
    // 황금사과 하나당 3점, 일반사과는 1점
    return baseScore + (goldenAppleCount * 2); // 기본 1점 + 황금사과당 추가 2점 = 총 3점
  };

  // 마우스 드래그 이벤트들 (ClassicMode와 동일)
  const handleMouseDown = (e) => {
    if (gameOver) return;
    
    mouseIsDownRef.current = true;
    
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    setIsSelecting(true);
    setSelectedCells([]);
    setStartPos({ x, y });
    
    createSelectionBox(x, y);
    
    e.preventDefault();
    e.stopPropagation();
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
  };

  const handleMouseUp = (e) => {
    if (!isSelecting) return;
    
    checkSelection();
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
  };  // 선택 상자 생성
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
    
    gameBoard.forEach(row => {
      row.forEach(cell => {
        if (!cell.isVisible) return;
        
        const cellElement = document.querySelector(`.board-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
        if (cellElement) {
          const cellRect = cellElement.getBoundingClientRect();
          const relativeCellRect = {
            left: cellRect.left - boardRect.left,
            top: cellRect.top - boardRect.top,
            right: cellRect.right - boardRect.left,
            bottom: cellRect.bottom - boardRect.top
          };
          
          const isOverlapping = !(
            relativeRect.right < relativeCellRect.left ||
            relativeRect.left > relativeCellRect.right ||
            relativeRect.bottom < relativeCellRect.top ||
            relativeRect.top > relativeCellRect.bottom
          );
          
          if (isOverlapping) {
            newSelectedCells.push(cell);
            cellElement.classList.add('selected');
          } else {
            cellElement.classList.remove('selected');
          }
        }
      });
    });
    
    setSelectedCells(newSelectedCells);
  };
  // 선택 확인 및 처리
  const checkSelection = () => {
    if (selectedCells.length === 0) return;
    
    const sum = calculateSelectionSum(selectedCells);
    
    if (sum === TARGET_SUM && selectedCells.length > 1) {
      const earnedScore = calculateScore(selectedCells);
      setScore(prevScore => prevScore + earnedScore);
      
      // 애니메이션 효과
      selectedCells.forEach(cell => {
        const cellElement = document.querySelector(`.board-cell[data-row="${cell.row}"][data-col="${cell.col}"] .apple-image`);
        if (cellElement) {
          cellElement.classList.add('apple-explode');
          
          setTimeout(() => {
            const newBoard = [...gameBoard];
            newBoard[cell.row][cell.col].isVisible = false;
            setGameBoard(newBoard);
          }, 250);
        }
      });
      
      setApplesRemoved(prev => prev + selectedCells.length);
    }
    
    setSelectedCells([]);
  };

  // 선택 상태 완전 정리
  const cleanupSelection = () => {
    document.querySelectorAll('.board-cell').forEach(cell => {
      cell.classList.remove('selected');
    });
    
    if (selectionBoxRef.current) {
      selectionBoxRef.current.remove();
      selectionBoxRef.current = null;
    }
    
    mouseIsDownRef.current = false;
    setIsSelecting(false);
    setSelectedCells([]);
  };

  // 타이머 관리
  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameOver(true);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, gameOver]);

  // 컴포넌트 마운트 시 보드 초기화
  useEffect(() => {
    initializeBoard();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 게임 재시작
  const restartGame = () => {
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameOver(false);
    setApplesRemoved(0);
    setSelectedCells([]);
    initializeBoard();
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 타이머 진행률 계산
  const calculateTimeProgress = () => {
    return (timeLeft / GAME_TIME) * 100;
  };  return (
    <div className="classic-mode-container">
      <div className="game-header">
        <div className="header-content">
          <h1 className="game-title">Golden Apple</h1>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${calculateTimeProgress()}%` }}
            ></div>
          </div>
          
          <div className="apple-score-container">
            <img src={AppleSVG} alt="Apple" className="apple-icon" />
            <span className="apple-count">{score}</span>          </div>
        </div>
      </div>      
      <div 
        ref={gameBoardRef} 
        className="game-board"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {gameBoard.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            cell.isVisible && (              <div
                key={`${rowIndex}-${colIndex}`}
                className="board-cell"
                data-row={rowIndex}
                data-col={colIndex}                style={{
                  left: `${83 + colIndex * 49}px`,
                  top: `${55 + rowIndex * 49}px`,
                }}
              >
                <img 
                  src={getAppleImage(cell)} 
                  alt="Apple"
                  className="apple-image"
                  draggable={false}
                />
              </div>
            )
          ))
        )}
      </div>      {gameOver && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2>Game Over!</h2>
            <p>최종 점수: {score}점</p>
            <p>제거한 사과: {applesRemoved}개</p>
            <p>남은 시간: {formatTime(timeLeft)}</p>
            <button onClick={restartGame} className="restart-button">다시 하기</button><button onClick={onBack} className="back-to-menu-button">메뉴로</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldenAppleMode;
