import React, { useState, useEffect } from 'react';
import '../styles/ArcadeMode.css';
import AppleDefault from '../../images/appleDefault.svg';
import GoldenApple from '../../images/goldenapple.svg';
import Apple1 from '../../images/apple1.svg';
import Apple2 from '../../images/apple2.svg';
import Apple3 from '../../images/apple3.svg';
import Apple4 from '../../images/apple4.svg';
import Apple5 from '../../images/apple5.svg';
import Apple6 from '../../images/apple6.svg';
import Apple7 from '../../images/apple7.svg';
import Apple8 from '../../images/apple8.svg';
import Apple9 from '../../images/apple9.svg';

const ArcadeMode = ({ mode, onBack }) => {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

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
  
  // 드래그 방지 핸들러
  const preventDrag = (e) => {
    e.preventDefault();
    return false;
  };

  useEffect(() => {
    initializeBoard();

    // 타이머 설정 (모드별로 다른 시간)
    const time = mode === 'tetple' ? 120 : mode === 'allClear' ? 90 : 60;
    setTimeLeft(time);
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // 모든 이미지에 드래그 방지 적용
    const images = document.querySelectorAll('.apple-image');
    images.forEach(img => {
      img.addEventListener('dragstart', preventDrag);
    });
    
    return () => {
      clearInterval(timer);
      // 컴포넌트 언마운트시 이벤트 리스너 제거
      images.forEach(img => {
        img.removeEventListener('dragstart', preventDrag);
      });
    };
  }, [mode]);

  const initializeBoard = () => {
    // 모드별로 다른 보드 설정
    let newBoard = [];
    
    switch(mode) {
      case 'tetple':
        // Tetple: 세로로 3개씩 연결된 사과들
        newBoard = Array(64).fill(null).map((_, index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isPattern = col % 3 === 0 && row < 6;
          return {
            value: Math.floor(Math.random() * 9) + 1,
            isVisible: true,
            isGolden: false,
            isPattern
          };
        });
        break;
        
      case 'partner':
        // Partner: 두 개씩 짝을 이루는 사과들
        newBoard = Array(64).fill(null).map((_, index) => {
          const isPair = index % 2 === 0;
          const pairValue = isPair ? Math.floor(Math.random() * 9) + 1 : newBoard[index - 1]?.value || 1;
          return {
            value: pairValue,
            isVisible: true,
            isGolden: false,
            isPair
          };
        });
        break;
        
      case 'allClear':
        // All Clear: 모든 사과를 없애면 보너스
        newBoard = Array(64).fill(null).map(() => ({
          value: Math.floor(Math.random() * 9) + 1,
          isVisible: true,
          isGolden: false
        }));
        break;
        
      case 'golden':
        // Golden Apple: 황금 사과가 많이 등장
        newBoard = Array(64).fill(null).map(() => ({
          value: Math.floor(Math.random() * 9) + 1,
          isVisible: true,
          isGolden: Math.random() > 0.7 // 30% 확률로 황금 사과
        }));
        break;
        
      default:
        newBoard = Array(64).fill(null).map(() => ({
          value: Math.floor(Math.random() * 9) + 1,
          isVisible: true,
          isGolden: Math.random() > 0.9
        }));
    }
    
    setBoard(newBoard);
  };

  const handleAppleClick = (index) => {
    const newBoard = [...board];
    if (!newBoard[index].isVisible) return;

    // 모드별 점수 계산
    let points = newBoard[index].value;
    
    if (mode === 'golden' && newBoard[index].isGolden) {
      points *= 5; // 골든 애플 모드에서 황금 사과는 5배 점수
    } else if (newBoard[index].isGolden) {
      points *= 3; // 일반 모드에서 황금 사과는 3배 점수
    }
    
    newBoard[index].isVisible = false;
    setBoard(newBoard);
    setScore(score + points);

    // All Clear 모드에서 모든 사과를 없앴을 때 보너스
    if (mode === 'allClear' && newBoard.filter(apple => apple.isVisible).length === 0) {
      setScore(prev => prev + 100); // 보너스 100점
    }

    // 만약 모든 사과가 사라졌다면 새 보드 생성
    if (newBoard.filter(apple => apple.isVisible).length === 0) {
      setTimeout(initializeBoard, 500);
    }
  };

  return (
    <div>
      <div className="arcade-header">
        <div className="score-display">점수: {score}</div>
        <div className="time-display">시간: {timeLeft}초</div>
        <div className="mode-display">{getModeTitle(mode)}</div>
      </div>
      <div className="game-board" onDragStart={preventDrag}>
        {board.map((apple, index) => (
          apple.isVisible && (
            <div
              className={`apple-container ${apple.isGolden ? 'golden' : ''}`}
              key={index}
              onClick={() => handleAppleClick(index)}
              draggable="false"
            >
              <img 
                src={apple.isGolden ? GoldenApple : appleImages[apple.value] || appleImages.default}
                alt={`Apple ${apple.value}`} 
                className="apple-image"
                draggable="false"
                onDragStart={preventDrag}
              />
            </div>
          )
        ))}
      </div>
      <div className="game-controls">
        <button onClick={initializeBoard}>다시 시작</button>
      </div>
    </div>
  );
};

// 모드별 제목
function getModeTitle(mode) {
  switch(mode) {
    case 'tetple': return 'Tetple Mode';
    case 'partner': return 'Partner Mode';
    case 'allClear': return 'Apple All Clear';
    case 'golden': return 'Golden Apple';
    default: return 'Arcade Mode';
  }
}

export default ArcadeMode; 