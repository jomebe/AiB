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

  // 게임 시작
  const startGame = () => {
    initializeBoard();
    setScore(0);
    setTimeLeft(GAME_TIME);
    setApplesRemoved(0);
    setGameOver(false);
    setAllClear(false);
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
    
    // 드래그 영역 계산
    const minX = Math.min(startPos.x, x);
    const maxX = Math.max(startPos.x, x);
    const minY = Math.min(startPos.y, y);
    const maxY = Math.max(startPos.y, y);
    
    const newSelectedCells = [];
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        if (cx >= 0 && cx < BOARD_SIZE_X && cy >= 0 && cy < BOARD_SIZE_Y) {
          if (gameBoard[cy]?.[cx] > 0) { // 빈 칸이 아닌 경우만 선택
            newSelectedCells.push({ x: cx, y: cy });
          }
        }
      }
    }
    
    setSelectedCells(newSelectedCells);
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
          Score: {score}
        </div>
      </div>
    </div>
  );
};

export default AppleAllClear;
