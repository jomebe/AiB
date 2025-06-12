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

const ClassicMode = ({ onBack }) => {
  // 게임 설정
  const BOARD_SIZE_X = 15; // 가로 칸 수
  const BOARD_SIZE_Y = 10; // 세로 칸 수
  const TARGET_SUM = 10;
  
  // 게임 상태
  const [gameBoard, setGameBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  
  const gameBoardRef = useRef(null);
  const selectionBoxRef = useRef(null);
  
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
  
  // 초기화
  useEffect(() => {
    initGame();
  }, []);
  
  const initGame = () => {
    setScore(0);
    setSelectedCells([]);
    setGameOver(false);
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
      Array(BOARD_SIZE_X).fill().map(() => ({
        value: getRandomAppleValue(),
        isVisible: true
      }))
    );
    
    setGameBoard(newBoard);
  };
  
  // 마우스 다운 이벤트
  const handleMouseDown = (e) => {
    if (gameOver) return;
    
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    setIsSelecting(true);
    setSelectedCells([]);
    setStartPos({ x, y });
    
    // 선택 상자 생성
    createSelectionBox(x, y);
  };
  
  // 마우스 이동 이벤트
  const handleMouseMove = (e) => {
    if (!isSelecting) return;
    
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    updateSelectionBox(x, y);
    updateSelectedCells();
  };
  
  // 마우스 업 이벤트
  const handleMouseUp = () => {
    if (!isSelecting) return;
    
    checkSelection();
    
    // 선택 상자 제거
    if (selectionBoxRef.current) {
      selectionBoxRef.current.remove();
      selectionBoxRef.current = null;
    }
    
    setIsSelecting(false);
  };
  
  // 선택 상자 생성
  const createSelectionBox = (x, y) => {
    const selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    
    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    
    gameBoardRef.current.appendChild(selectionBox);
    selectionBoxRef.current = selectionBox;
  };
  
  // 선택 상자 업데이트
  const updateSelectionBox = (currentX, currentY) => {
    if (!selectionBoxRef.current) return;
    
    const boxLeft = Math.min(startPos.x, currentX);
    const boxTop = Math.min(startPos.y, currentY);
    const boxWidth = Math.abs(currentX - startPos.x);
    const boxHeight = Math.abs(currentY - startPos.y);
    
    selectionBoxRef.current.style.left = `${boxLeft}px`;
    selectionBoxRef.current.style.top = `${boxTop}px`;
    selectionBoxRef.current.style.width = `${boxWidth}px`;
    selectionBoxRef.current.style.height = `${boxHeight}px`;
  };
  
  // 선택된 셀 업데이트
  const updateSelectedCells = () => {
    if (!selectionBoxRef.current || !gameBoardRef.current) return;
    
    const selectionRect = selectionBoxRef.current.getBoundingClientRect();
    const cells = document.querySelectorAll('.apple-cell');
    const selected = [];
    
    cells.forEach(cell => {
      const cellRect = cell.getBoundingClientRect();
      
      // 셀이 선택 상자와 겹치는지 확인하고 visible한 셀만 선택
      if (
        cellRect.right > selectionRect.left &&
        cellRect.left < selectionRect.right &&
        cellRect.bottom > selectionRect.top &&
        cellRect.top < selectionRect.bottom
      ) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (gameBoard[row] && gameBoard[row][col] && gameBoard[row][col].isVisible) {
          cell.classList.add('selected');
          selected.push({
            row: row,
            col: col,
            value: gameBoard[row][col].value
          });
        }
      } else {
        cell.classList.remove('selected');
      }
    });
    
    setSelectedCells(selected);
  };
  
  // 선택 확인
  const checkSelection = () => {
    if (selectedCells.length < 2) {
      return; // 최소 2개 이상의 셀이 선택되어야 함
    }
    
    const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
    
    // 합이 목표값과 일치하면 점수 획득
    if (sum === TARGET_SUM) {
      // 점수 계산: 선택한 셀의 수
      const gainedScore = selectedCells.length;
      setScore(prev => prev + gainedScore);
      
      // 선택된 셀 제거
      removeSelectedCells();
    }
    
    // 모든 셀에서 선택 클래스 제거
    document.querySelectorAll('.apple-cell').forEach(cell => {
      cell.classList.remove('selected');
    });
  };
  
  // 선택된 셀 제거
  const removeSelectedCells = () => {
    const newBoard = [...gameBoard.map(row => [...row])];
    
    selectedCells.forEach(cell => {
      if (newBoard[cell.row] && newBoard[cell.row][cell.col]) {
        newBoard[cell.row][cell.col].isVisible = false;
      }
    });
    
    setGameBoard(newBoard);
    setSelectedCells([]);
  };

  return (
    <div className="classic-mode-container">
      <div className="game-header">
        <h1>클래식 애플</h1>
        <div className="score-display">점수: {score}</div>
      </div>
      
      <div 
        ref={gameBoardRef} 
        className="game-board"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 게임 보드를 행과 열로 명확하게 렌더링 */}
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
              >
                {cell.isVisible && (
                  <img 
                    src={appleImages[cell.value] || appleImages.default} 
                    alt={`Apple ${cell.value}`} 
                    className="apple-image" 
                  />
                )}
              </div>
            );
          })
        )).flat()}
      </div>
      
      <div className="game-controls">
        <button onClick={initGame}>다시 시작</button>
      </div>
    </div>
  );
};

export default ClassicMode;