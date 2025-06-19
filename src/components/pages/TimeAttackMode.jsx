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

const TimeAttackMode = ({ onBack }) => {
  // 게임 설정
  const BOARD_SIZE = 4; // 4x4 격자
  const TARGET_SUM = 10;
  const GAME_TIME = 60; // 1분 (초 단위)
  // 게임 상태
  const [gameBoard, setGameBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [applesRemoved, setApplesRemoved] = useState(0);
  const [noMoreMoves, setNoMoreMoves] = useState(false);
  
  const gameBoardRef = useRef(null);
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
  };

  // 게임 시작
  const startGame = () => {
    setGameOver(false);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setApplesRemoved(0);
    setNoMoreMoves(false);
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
  };

  // 10을 만들 수 있는 조합이 있는지 체크
  const checkForPossibleMoves = (board = gameBoard) => {
    if (board.length === 0) return;
    
    let hasValidMoves = false;
    
    // 2개 조합 체크
    for (let y1 = 0; y1 < BOARD_SIZE; y1++) {
      for (let x1 = 0; x1 < BOARD_SIZE; x1++) {
        for (let y2 = 0; y2 < BOARD_SIZE; y2++) {
          for (let x2 = 0; x2 < BOARD_SIZE; x2++) {
            if (x1 !== x2 || y1 !== y2) {
              if (board[y1][x1].value + board[y2][x2].value === TARGET_SUM) {
                hasValidMoves = true;
                break;
              }
            }
          }
          if (hasValidMoves) break;
        }
        if (hasValidMoves) break;
      }
      if (hasValidMoves) break;
    }
    
    if (!hasValidMoves) {
      setNoMoreMoves(true);
      setGameOver(true);
    }
  };

  // 게임 재시작
  const restartGame = () => {
    startGame();
  };

  // 타이머 이펙트
  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
    }
  }, [timeLeft, gameOver]);

  // 컴포넌트 마운트 시 보드 초기화
  useEffect(() => {
    initializeBoard();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      </div>

      {/* 게임 보드 */}
      <div 
        ref={gameBoardRef}
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
          marginBottom: '30px'
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
              border: cell.selected ? '3px solid #FF6B6B' : '2px solid transparent'
            }}
          >
            <img 
              src={appleImages[cell.value] || appleImages.default} 
              alt={`Apple ${cell.value}`} 
              className="apple-image" 
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain'
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
        </button>
      </div>

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
