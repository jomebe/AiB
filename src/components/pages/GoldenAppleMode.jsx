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
import AppleSVG from '../../images/apples.svg';

const GoldenAppleMode = ({ onBack }) => {
  // 게임 설정
  const BOARD_SIZE_X = 15; // 가로 칸 수
  const BOARD_SIZE_Y = 10; // 세로 칸 수
  const TARGET_SUM = 10;
  const GAME_TIME = 120; // 2분 (초 단위)
  
  // 사과 타입 정의
  const APPLE_TYPES = {
    NORMAL: 'normal',
    GOLDEN: 'golden',
    RAINBOW: 'rainbow',
    BLACK: 'black'
  };
  
  // 게임 상태
  const [gameBoard, setGameBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [applesRemoved, setApplesRemoved] = useState(0);
  
  const gameBoardRef = useRef(null);
  const selectionBoxRef = useRef(null);
  const mouseIsDownRef = useRef(false);
  const timerRef = useRef(null);
  
  // 일반 사과 이미지 매핑
  const normalAppleImages = {
    1: Apple1, 2: Apple2, 3: Apple3, 4: Apple4, 5: Apple5,
    6: Apple6, 7: Apple7, 8: Apple8, 9: Apple9,
    default: AppleDefault
  };
  
  // 황금 사과 이미지 매핑
  const goldenAppleImages = {
    1: GoldenApple1, 2: GoldenApple2, 3: GoldenApple3,
    4: GoldenApple4, 5: GoldenApple5, 6: GoldenApple6,
    7: GoldenApple7, 8: GoldenApple8, 9: GoldenApple9
  };
  
  // 사과 이미지 가져오기
  const getAppleImage = (cell) => {
    if (cell.type === APPLE_TYPES.RAINBOW) {
      return RainbowApple;
    } else if (cell.type === APPLE_TYPES.BLACK) {
      return BugApple;
    } else if (cell.type === APPLE_TYPES.GOLDEN) {
      return goldenAppleImages[cell.value] || goldenAppleImages[1];
    } else {
      return normalAppleImages[cell.value] || normalAppleImages.default;
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
    return false;
  };
  const handleRankingClick = () => {
    console.log('랭킹 조회 요청');
  };
    // 전역 마우스 업 이벤트 핸들러
  const handleGlobalMouseUp = useCallback((e) => {
    mouseIsDownRef.current = false;
      if (isSelecting) {
      handleMouseUp(e);
    }  }, [isSelecting]);
  
  // 게임 보드 생성 - 먼저 정의
  const generateBoard = useCallback(() => {
    const newBoard = Array(BOARD_SIZE_Y).fill().map(() =>      Array(BOARD_SIZE_X).fill(null)
    );
    
    // 모든 위치 배열 생성
    const positions = [];
    for (let row = 0; row < BOARD_SIZE_Y; row++) {
      for (let col = 0; col < BOARD_SIZE_X; col++) {
        positions.push({ row, col });
      }
    }
    
    // 위치 섞기
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    let positionIndex = 0;
    
    // 황금사과 5개 배치
    for (let i = 0; i < 5; i++) {
      const pos = positions[positionIndex++];
      newBoard[pos.row][pos.col] = {
        type: APPLE_TYPES.GOLDEN,
        value: Math.floor(Math.random() * 9) + 1,
        isVisible: true,
        isSelectable: true
        };
      }
      
    // 무지개사과 5개 배치
    for (let i = 0; i < 5; i++) {
      const pos = positions[positionIndex++];
      newBoard[pos.row][pos.col] = {
        type: APPLE_TYPES.RAINBOW,
        value: 0,
        isVisible: true,
        isSelectable: true
      };
    }
    
    // 썩은사과(검정사과) 5개 배치
    for (let i = 0; i < 5; i++) {
      const pos = positions[positionIndex++];
      newBoard[pos.row][pos.col] = {
        type: APPLE_TYPES.BLACK,
        value: 0,
        isVisible: true,
        isSelectable: false
      };
    }
    
    // 나머지 위치에 일반 사과 배치
    for (let i = positionIndex; i < positions.length; i++) {
      const pos = positions[i];
      newBoard[pos.row][pos.col] = {
        type: APPLE_TYPES.NORMAL,
        value: Math.floor(Math.random() * 9) + 1,
        isVisible: true,
        isSelectable: true
      };
    }
      setGameBoard(newBoard);
  }, []); // generateBoard는 외부 의존성이 없으므로 빈 배열
    // 게임 초기화 함수
  const initGame = useCallback(() => {
    setScore(0);
    setSelectedCells([]);
    setGameOver(false);
    setTimeLeft(GAME_TIME);
    setApplesRemoved(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
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
    
    generateBoard();
  }, []); // generateBoard 의존성 제거

  // 초기화
  useEffect(() => {
    initGame();
    
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

  // 마우스 다운 이벤트
  const handleMouseDown = (e) => {
    if (e.button === 2) return;
    if (gameOver) return;
    
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
    
    updateSelectionBox(x, y);
    updateSelectedCells();
    
    e.preventDefault();
    e.stopPropagation();
  };
  
  // 선택 상태 완전 정리
  const cleanupSelection = () => {
    document.querySelectorAll('.apple-cell').forEach(cell => {
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
  
  // 마우스 업 이벤트
  const handleMouseUp = (e) => {
    if (!isSelecting) return;
    
    checkSelection();
    cleanupSelection();
    
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
      
      const cellRect = cell.getBoundingClientRect();
      
      const cellCenterX = cellRect.left + cellRect.width / 2;
      const cellCenterY = cellRect.top + cellRect.height / 2;
      
      if (
        cellCenterX >= selectionRect.left &&
        cellCenterX <= selectionRect.right &&
        cellCenterY >= selectionRect.top &&
        cellCenterY <= selectionRect.bottom
      ) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellData = gameBoard[row]?.[col];
        
        // 검정 사과(방벽)는 선택 불가
        if (cellData && cellData.isSelectable) {
          cell.classList.add('selected');
          
          selectedCellsData.push({
            row: row,
            col: col,
            value: parseInt(cell.dataset.value) || 0,
            type: cell.dataset.type,
            cellData: cellData
          });
        }
      }
    });
    
    setSelectedCells(selectedCellsData);
  };
    // 선택 검사 - 골든 애플 모드 특별 규칙
  const checkSelection = () => {
    if (selectedCells.length < 2) return;
    
    // 무지개 사과가 있는지 확인
    const rainbowApples = selectedCells.filter(cell => cell.type === APPLE_TYPES.RAINBOW);
    const normalApples = selectedCells.filter(cell => cell.type === APPLE_TYPES.NORMAL);
    const goldenApples = selectedCells.filter(cell => cell.type === APPLE_TYPES.GOLDEN);
    
    let isValidSelection = false;
    let totalScore = 0;
    
    // 무지개 사과가 포함된 경우
    if (rainbowApples.length > 0) {
      // 무지개 사과 + 다른 사과들의 합이 10 이하여야 함
      const otherApplesSum = normalApples.reduce((sum, cell) => sum + cell.cellData.value, 0) +
                           goldenApples.reduce((sum, cell) => sum + cell.cellData.value, 0);
        if (otherApplesSum <= TARGET_SUM && otherApplesSum > 0) {
        isValidSelection = true;
        // 점수 계산: 일반사과는 1점, 황금사과는 3점, 무지개사과는 1점
        const normalScore = normalApples.length * 1;
        const goldenScore = goldenApples.length * 3;
        const rainbowScore = rainbowApples.length * 1;
        totalScore = normalScore + goldenScore + rainbowScore;
      }
    }
    // 일반적인 경우 (무지개 사과 없음)
    else {
      const sum = normalApples.reduce((sum, cell) => sum + cell.cellData.value, 0) +
                 goldenApples.reduce((sum, cell) => sum + cell.cellData.value, 0);
        if (sum === TARGET_SUM) {
        isValidSelection = true;
        // 점수 계산: 일반사과는 1점, 황금사과는 3점
        const normalScore = normalApples.length * 1;
        const goldenScore = goldenApples.length * 3;
        totalScore = normalScore + goldenScore;
      }
    }
      if (isValidSelection) {
      // 디버깅을 위한 로그
      console.log('=== 점수 계산 디버깅 ===');
      console.log('일반사과 개수:', normalApples.length);
      console.log('황금사과 개수:', goldenApples.length);
      console.log('무지개사과 개수:', rainbowApples.length);
      console.log('계산된 점수:', totalScore);
      console.log('일반사과 점수:', normalApples.length * 1);
      console.log('황금사과 점수:', goldenApples.length * 3);
      console.log('무지개사과 점수:', rainbowApples.length * 1);
      console.log('=======================');
      
      // 점수 추가
      setScore(prevScore => prevScore + totalScore);
        // 애니메이션 효과
      selectedCells.forEach(cell => {
        const cellElement = document.querySelector(`.board-cell[data-row="${cell.row}"][data-col="${cell.col}"] .apple-image`);
        if (cellElement) {
          cellElement.classList.add('apple-explode');
        }
      });

      // 애니메이션이 끝나면 모든 선택된 사과를 한 번에 제거
      setTimeout(() => {
        setGameBoard(prevBoard => {
          const newBoard = prevBoard.map(row => [...row]);
          selectedCells.forEach(cell => {
            newBoard[cell.row][cell.col].isVisible = false;
          });
          return newBoard;
        });
      }, 250);
      
      setApplesRemoved(prev => prev + selectedCells.length);
    }
    
    setSelectedCells([]);
  };
  
  // 타이머 진행률 계산
  const calculateTimeProgress = () => {
    return (timeLeft / GAME_TIME) * 100;
  };
  
  return (
    <div className="classic-mode-container">      <div className="game-header">
        <div className="header-content">
          <h1 className="game-title">Golden Apple Mode</h1>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${calculateTimeProgress()}%` }}
            ></div>
          </div>
          
          <div className="apple-score-container">
            <img src={AppleSVG} alt="Apple" className="apple-icon" />
            <span className="apple-count">{score}</span>
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
        onSelectStart={preventDrag}
      >
        {Array.from({ length: BOARD_SIZE_Y }).map((_, rowIndex) => (
          Array.from({ length: BOARD_SIZE_X }).map((_, colIndex) => {
            const cell = gameBoard[rowIndex] && gameBoard[rowIndex][colIndex];
            if (!cell) return null;
            
            return (
              <div 
                key={`${rowIndex}-${colIndex}`} 
                className={`board-cell ${cell.isVisible ? 'apple-cell' : 'empty-cell'} ${cell.type === APPLE_TYPES.BLACK ? 'black-apple' : ''}`}
                data-row={rowIndex}
                data-col={colIndex}
                data-value={cell.value}
                data-type={cell.type}
                style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 1 }}
                draggable="false"
                onContextMenu={preventContextMenu}
                onDragStart={preventDrag}
                onSelectStart={preventDrag}
              >
                {cell.isVisible && (                  <img 
                    src={getAppleImage(cell)} 
                    alt={`${cell.type} Apple ${cell.value}`} 
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
        {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <div className="game-over-header">
              <div className="game-over-icon">🍯</div>
              <h2 className="game-over-title">게임 완료!</h2>
            </div>
            
            <div className="game-over-stats">
              <div className="stat-item">
                <div className="stat-value">{score.toLocaleString()}</div>
                <div className="stat-label">최종 점수</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{applesRemoved}</div>
                <div className="stat-label">제거한 사과</div>
              </div>
            </div>
            
            <div className="game-over-actions">
              <button onClick={initGame} className="primary-button">
                <span className="button-icon">🔄</span>
                다시 시작
              </button>
              <button onClick={onBack} className="secondary-button">
                <span className="button-icon">🏠</span>
                메인으로
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button className="ranking-button" onClick={handleRankingClick}>
        <span className="trophy-icon">🏆</span>
      </button>
    </div>
  );
};

export default GoldenAppleMode;
