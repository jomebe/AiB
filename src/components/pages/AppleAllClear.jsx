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
import Rankings from '../Rankings/Rankings';

const AppleAllClear = ({ onBack }) => {
  // 게임 설정
  const BOARD_SIZE_X = 15; // 가로 칸 수
  const BOARD_SIZE_Y = 10; // 세로 칸 수
  const TARGET_SUM = 10;
  const GAME_TIME = 120; // 2분 (초 단위)
  
  // 게임 상태
  const [gameBoard, setGameBoard] = useState([]);  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [applesRemoved, setApplesRemoved] = useState(0);
  const [allClear, setAllClear] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  
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
  
  // 랜덤 숫자 생성 (1~9)
  const getRandomAppleValue = () => {
    return Math.floor(Math.random() * 9) + 1;
  };
  
  // 게임 보드 생성 - 먼저 정의
  const generateBoard = useCallback(() => {
    // 10x15 배열 생성 (세로 10줄, 가로 15칸)
    const newBoard = Array(BOARD_SIZE_Y).fill().map(() => 
      Array(BOARD_SIZE_X).fill().map(() => ({
        value: getRandomAppleValue(),
        isVisible: true
      }))
    );
    
    setGameBoard(newBoard);
  }, []);

  const initGame = useCallback(() => {
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
      generateBoard();
  }, []); // generateBoard 의존성 제거
  
  // 초기화
  useEffect(() => {
    initGame();
    
    // 전역 이벤트 리스너 추가
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('contextmenu', preventContextMenu);
    
    return () => {
      // 전역 이벤트 리스너 제거
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('contextmenu', preventContextMenu);
      
      // 타이머 정리
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // 빈 배열로 변경 - 컴포넌트 마운트시에만 실행
  
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
  
  // 모든 사과가 제거되었는지 확인
  const checkAllClear = (board) => {
    return board.every(row => row.every(cell => !cell.isVisible));
  };
    // 선택 검사
  const checkSelection = () => {
    if (selectedCells.length < 2) return;
    
    // 선택된 셀의 값 합계 계산
    const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
    
    // 합계가 목표값과 일치하는지 확인
    if (sum === TARGET_SUM) {      // 점수 추가
      setScore(prevScore => prevScore + selectedCells.length); // 사과 하나당 1점
      
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
          
          // 모든 사과가 제거되었는지 확인
          if (checkAllClear(newBoard)) {
            setAllClear(true);
            setGameOver(true);
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
          }
          
          return newBoard;
        });
      }, 250); // 애니메이션 시간과 맞춤 (0.25초)
      
      // 제거된 사과 개수 업데이트
      setApplesRemoved(prev => prev + selectedCells.length);
    }
    
    setSelectedCells([]);
  };

  // 타이머 진행률 계산 (0~100)
  const calculateTimeProgress = () => {
    return (timeLeft / GAME_TIME) * 100;
  };

  return (
    <div className="classic-mode-container">
      <div className="game-header">
        <div className="header-content">
          <h1 className="game-title">Apple All Clear</h1>
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
                draggable="false"
                onContextMenu={preventContextMenu}
                onDragStart={preventDrag}
                onSelectStart={preventDrag}
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
        {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <div className="game-over-header">
              <div className="game-over-icon">{allClear ? '🎉' : '🎯'}</div>
              <h2 className="game-over-title">
                {allClear ? 'All Clear!' : '게임 완료!'}
              </h2>
              {allClear && (
                <p className="game-over-subtitle">모든 사과를 제거했습니다!</p>
              )}
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
        {/* 랭킹 버튼 */}
      <button className="ranking-button" onClick={handleRankingClick}>
        <span className="trophy-icon">🏆</span>
      </button>

      {/* 랭킹 모달 */}
      {showRanking && (
        <div className="ranking-modal-overlay">
          <div className="ranking-modal-content">
            <div className="ranking-modal-header">
              <h2>🏆 랭킹</h2>
              <button onClick={handleCloseRanking} className="close-button">
                ×
              </button>
            </div>
            <Rankings onBack={handleCloseRanking} isModal={true} isOpen={showRanking} gameMode="appleallclear" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppleAllClear;
