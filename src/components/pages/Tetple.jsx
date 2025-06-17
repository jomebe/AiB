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

const Tetple = ({ onBack }) => {
  // 게임 설정
  const BOARD_SIZE_X = 12;
  const BOARD_SIZE_Y = 8;
  const TARGET_SUM = 10;
  const GAME_TIME = 180; // 3분 (초 단위)
  
  // 게임 상태
  const [gameBoard, setGameBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [level, setLevel] = useState(1);
  const [targetClears, setTargetClears] = useState(10);
  const [currentClears, setCurrentClears] = useState(0);
  
  const gameBoardRef = useRef(null);
  const selectionBoxRef = useRef(null);
  const mouseIsDownRef = useRef(false);
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

  // 랜덤 사과 값 생성 (Tetple은 1-5만 사용)
  const generateRandomApple = () => {
    return Math.floor(Math.random() * 5) + 1;
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
    
    // 최소한 하나의 해결책 보장
    ensureSolutions(newBoard);
    setGameBoard(newBoard);
  };

  // 해결책 보장
  const ensureSolutions = (board) => {
    // 2x2 형태로 TARGET_SUM이 되는 조합 생성
    const solutions = [];
    for (let i = 0; i < 3; i++) {
      const startY = Math.floor(Math.random() * (BOARD_SIZE_Y - 1));
      const startX = Math.floor(Math.random() * (BOARD_SIZE_X - 1));
      
      // 2x2 영역의 합이 TARGET_SUM이 되도록 설정
      const values = [
        Math.floor(Math.random() * 3) + 1,
        Math.floor(Math.random() * 3) + 1,
        Math.floor(Math.random() * 3) + 1
      ];
      const lastValue = TARGET_SUM - values.reduce((sum, val) => sum + val, 0);
      
      if (lastValue >= 1 && lastValue <= 5) {
        board[startY][startX] = values[0];
        board[startY][startX + 1] = values[1];
        board[startY + 1][startX] = values[2];
        board[startY + 1][startX + 1] = lastValue;
        
        solutions.push([
          { x: startX, y: startY },
          { x: startX + 1, y: startY },
          { x: startX, y: startY + 1 },
          { x: startX + 1, y: startY + 1 }
        ]);
      }
    }
  };

  // 게임 시작
  const startGame = () => {
    initializeBoard();
    setScore(0);
    setTimeLeft(GAME_TIME);
    setLevel(1);
    setCurrentClears(0);
    setTargetClears(10);
    setGameOver(false);
    setSelectedCells([]);
    
    // 타이머 시작
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 레벨업 체크
  const checkLevelUp = () => {
    if (currentClears >= targetClears) {
      setLevel(prev => prev + 1);
      setCurrentClears(0);
      setTargetClears(prev => prev + 5);
      setTimeLeft(prev => Math.min(prev + 30, GAME_TIME)); // 보너스 시간
      
      // 새로운 보드 생성
      setTimeout(() => {
        initializeBoard();
      }, 1000);
      
      return true;
    }
    return false;
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
    if (sum === TARGET_SUM && selectedCells.length === 4) { // Tetple은 정확히 4개여야 함
      const newBoard = [...gameBoard];
      
      // 선택된 사과들을 0으로 설정
      selectedCells.forEach(cell => {
        if (newBoard[cell.y]?.[cell.x]) {
          newBoard[cell.y][cell.x] = 0;
        }
      });
      
      // 빈 공간을 위에서 떨어뜨리기
      dropApples(newBoard);
      
      setGameBoard(newBoard);
      setScore(prev => prev + level * 100); // 레벨에 따른 점수
      setCurrentClears(prev => prev + 1);
      
      // 레벨업 체크
      checkLevelUp();
      
      return true;
    }
    return false;
  };

  // 사과 떨어뜨리기 (테트리스처럼)
  const dropApples = (board) => {
    for (let x = 0; x < BOARD_SIZE_X; x++) {
      // 각 열에서 빈 공간이 아닌 사과들을 아래로 정렬
      const column = [];
      for (let y = BOARD_SIZE_Y - 1; y >= 0; y--) {
        if (board[y][x] !== 0) {
          column.push(board[y][x]);
        }
      }
      
      // 빈 공간을 새로운 사과로 채우기
      while (column.length < BOARD_SIZE_Y) {
        column.push(generateRandomApple());
      }
      
      // 열을 다시 보드에 배치
      for (let y = 0; y < BOARD_SIZE_Y; y++) {
        board[y][x] = column[BOARD_SIZE_Y - 1 - y];
      }
    }
  };

  // 마우스 다운 이벤트
  const handleMouseDown = (e) => {
    if (gameOver) return;
    
    e.preventDefault();
    mouseIsDownRef.current = true;
    setIsSelecting(true);
    
    const rect = gameBoardRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / BOARD_SIZE_X));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / BOARD_SIZE_Y));
    
    setStartPos({ x, y });
    setSelectedCells([{ x, y }]);
  };

  // 마우스 이동 이벤트
  const handleMouseMove = (e) => {
    if (!mouseIsDownRef.current || gameOver) return;
    
    e.preventDefault();
    const rect = gameBoardRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / BOARD_SIZE_X));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / BOARD_SIZE_Y));
    
    // 2x2 영역만 선택 가능
    const minX = Math.min(startPos.x, x);
    const maxX = Math.max(startPos.x, x);
    const minY = Math.min(startPos.y, y);
    const maxY = Math.max(startPos.y, y);
    
    // 2x2 크기로 제한
    if (maxX - minX === 1 && maxY - minY === 1) {
      const newSelectedCells = [];
      for (let cy = minY; cy <= maxY; cy++) {
        for (let cx = minX; cx <= maxX; cx++) {
          if (cx >= 0 && cx < BOARD_SIZE_X && cy >= 0 && cy < BOARD_SIZE_Y) {
            if (gameBoard[cy]?.[cx] > 0) {
              newSelectedCells.push({ x: cx, y: cy });
            }
          }
        }
      }
      setSelectedCells(newSelectedCells);
    }
  };

  // 마우스 업 이벤트
  const handleMouseUp = () => {
    if (!mouseIsDownRef.current) return;
    
    mouseIsDownRef.current = false;
    setIsSelecting(false);
    
    const success = removeSelectedApples();
    if (!success) {
      setSelectedCells([]);
    } else {
      setSelectedCells([]);
    }
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
    startGame();
    
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

  return (
    <div className="classic-mode-container">
      <div className="game-header">
        <div className="header-content">
          <div className="game-title">Tetple - Level {level}</div>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
            ></div>
          </div>
          <div className="apple-score-container">
            <img src={AppleSVG} alt="Apple" className="apple-icon" />
            <span className="apple-count">{currentClears}/{targetClears}</span>
          </div>
        </div>
        <div className="time-display">
          Time: {formatTime(timeLeft)} | Score: {score}
        </div>
      </div>

      <div 
        className="game-board"
        ref={gameBoardRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          mouseIsDownRef.current = false;
          setIsSelecting(false);
        }}
        style={{ 
          gridTemplateColumns: `repeat(${BOARD_SIZE_X}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE_Y}, 1fr)`
        }}
      >
        {gameBoard.map((row, y) =>
          row.map((cell, x) => {
            const isSelected = selectedCells.some(selected => selected.x === x && selected.y === y);
            const isEmpty = cell === 0;
            
            return (
              <div
                key={`${x}-${y}`}
                className={`board-cell ${isEmpty ? 'empty-cell' : 'apple-cell'} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${(x / BOARD_SIZE_X) * 100}%`,
                  top: `${(y / BOARD_SIZE_Y) * 100}%`,
                  width: `${100 / BOARD_SIZE_X}%`,
                  height: `${100 / BOARD_SIZE_Y}%`,
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
        )}
        
        {/* 선택 박스 표시 */}
        {isSelecting && selectedCells.length > 0 && (
          <div className="selection-info" style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            선택된 합: {calculateSelectedSum()} / {TARGET_SUM} (2x2 영역만 가능)
          </div>
        )}
      </div>

      {/* 게임 오버 화면 */}
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>⏰ Time Up!</h2>
            <p>Level: {level}</p>
            <p>Score: {score}</p>
            <p>Clears: {currentClears}</p>
            <div className="game-over-buttons">
              <button onClick={startGame}>다시하기</button>
              <button onClick={onBack}>뒤로가기</button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div className="game-controls">
        <button onClick={startGame} className="control-button">
          새 게임
        </button>
        <button onClick={onBack} className="control-button">
          뒤로가기
        </button>
        <div className="score-display">
          Level {level} | Score: {score}
        </div>
      </div>
    </div>
  );
};

export default Tetple;
