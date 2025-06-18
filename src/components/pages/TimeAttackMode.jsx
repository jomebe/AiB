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
import ApplesSVG from '../../images/apples.svg';

const TimeAttackMode = ({ onBack }) => {  // 게임 설정
  const BOARD_SIZE = 4; // 4x4 격자
  const TARGET_SUM = 10;
  const GAME_TIME = 60; // 1분 (초 단위)
    // 게임 상태
  const [gameBoard, setGameBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [applesRemoved, setApplesRemoved] = useState(0);
  const [noMoreMoves, setNoMoreMoves] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  
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
    // 게임 보드 초기화
  const initializeBoard = () => {
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
    setGameBoard(board);
    
    // 초기 보드에서 가능한 움직임 체크
    setTimeout(() => {
      checkForPossibleMoves(board);
    }, 100);
  };  // 새로운 사과 생성 (10을 만들었을 때)
  const generateNewApples = (removedCells) => {
    const newBoard = [...gameBoard];
    
    removedCells.forEach(cell => {
      newBoard[cell.y][cell.x] = {
        id: `${cell.x}-${cell.y}`,
        value: Math.floor(Math.random() * 9) + 1,
        x: cell.x,
        y: cell.y,
        selected: false
      };
      
      // 애니메이션 클래스 제
      const cellElement = document.querySelector(`[data-cell-id="${cell.id}"] .apple-image`);
      if (cellElement) {
        cellElement.classList.remove('apple-explode');
      }
    });
    
    setGameBoard(newBoard);
    
    // 새로운 보드에서 더 이상 움직일 수 있는지 체크
    setTimeout(() => {
      checkForPossibleMoves(newBoard);
    }, 100);
  };

  // 10을 만들 수 있는 조합이 있는지 체크
  const checkForPossibleMoves = (board = gameBoard) => {
    if (board.length === 0) return;
    
    // 모든 가능한 직사각형 조합을 체크
    for (let y1 = 0; y1 < BOARD_SIZE; y1++) {
      for (let x1 = 0; x1 < BOARD_SIZE; x1++) {
        for (let y2 = y1; y2 < BOARD_SIZE; y2++) {
          for (let x2 = x1; x2 < BOARD_SIZE; x2++) {
            // 직사각형 영역의 합 계산
            let sum = 0;
            let cellCount = 0;
            
            for (let y = y1; y <= y2; y++) {
              for (let x = x1; x <= x2; x++) {
                sum += board[y][x].value;
                cellCount++;
              }
            }
            
            // 합이 10이고 2개 이상의 셀이면 가능한 움직임
            if (sum === TARGET_SUM && cellCount > 1) {
              return true;
            }
          }
        }
      }
    }
    
    // 가능한 움직임이 없으면 게임 종료
    setNoMoreMoves(true);
    return false;
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
  }, []);  // 마우스 이벤트 핸들러 (ClassicMode와 동일한 드래그 시스템)
  const handleMouseDown = (e) => {
    if (gameOver || noMoreMoves) return;
    
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
    if (!isSelecting || !mouseIsDownRef.current || gameOver || noMoreMoves) return;
    
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
    
    gameBoard.forEach(row => {
      row.forEach(cell => {
        const cellElement = document.querySelector(`[data-cell-id="${cell.id}"]`);
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
  };  // 선택 확인 및 처리
  const checkSelection = () => {
    if (selectedCells.length === 0) return;
    
    const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
    
    if (sum === TARGET_SUM && selectedCells.length > 1) {
      setScore(score + selectedCells.length);
      setApplesRemoved(applesRemoved + selectedCells.length);
      
      // 애니메이션 효과를 위해 선택된 셀에 클래스 추가
      selectedCells.forEach(cell => {
        const cellElement = document.querySelector(`[data-cell-id="${cell.id}"] .apple-image`);
        if (cellElement) {
          // 펑 터지는 애니메이션 적용
          cellElement.classList.add('apple-explode');
        }
      });
      
      // 애니메이션이 끝나면 새로운 사과로 교체
      setTimeout(() => {
        generateNewApples(selectedCells);
      }, 250); // 애니메이션 시간과 맞춤 (0.25초)
    }
  };

  // 직사각형 영역의 셀들을 가져오는 함수
  const getCellsInRectangle = (start, end) => {
    const cells = [];
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (y >= 0 && y < BOARD_SIZE && x >= 0 && x < BOARD_SIZE) {
          cells.push(gameBoard[y][x]);
        }
      }
    }
    
    return cells;
  };
  // 게임 재시작
  const restartGame = () => {
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameOver(false);
    setNoMoreMoves(false);
    setApplesRemoved(0);
    setSelectedCells([]);
    initializeBoard();
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };  return (
    <div className="classic-container">
      {/* 두 번째 이미지처럼 상단 UI 구성 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%', 
        maxWidth: '800px',
        marginBottom: '30px',
        padding: '0 20px'
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
      </div>      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        <div 
          className="game-board time-attack-board"
          ref={gameBoardRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {gameBoard.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={cell.id}
                data-cell-id={cell.id}
                className="apple-cell"
                style={{
                  gridColumn: colIndex + 1,
                  gridRow: rowIndex + 1
                }}
              >
                <img 
                  src={appleImages[cell.value] || appleImages.default} 
                  alt={`Apple ${cell.value}`}
                  className="apple-image"
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            ))
          )}        </div>
      </div>

      {/* No More Moves 알림 */}
      {noMoreMoves && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '30px',
          borderRadius: '20px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>No More Moves!</h2>
          <p style={{ margin: '0 0 20px 0', color: '#666' }}>더 이상 10을 만들 수 있는 조합이 없습니다.</p>
          <p style={{ margin: '0 0 20px 0', color: '#333' }}>Final Score: {score}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={restartGame} 
              className="back-button"
              style={{ margin: 0 }}
            >
              재시작
            </button>
            <button 
              onClick={onBack} 
              className="back-button"
              style={{ margin: 0 }}
            >
              끝내기
            </button>
          </div>
        </div>
      )}

      {gameOver && !noMoreMoves && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
            <p>Apples Removed: {applesRemoved}</p>
            <button onClick={restartGame} className="back-button">재시작</button>
            <button onClick={onBack} className="back-button">끝내기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeAttackMode;
