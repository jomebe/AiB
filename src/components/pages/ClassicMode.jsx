import React, { useState, useEffect } from 'react';
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

const ClassicMode = () => {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);

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

  useEffect(() => {
    initializeBoard();
  }, []);

  const initializeBoard = () => {
    const newBoard = Array(64).fill(null).map(() => ({
      value: Math.floor(Math.random() * 9) + 1,
      isVisible: true,
    }));
    setBoard(newBoard);
  };

  const handleAppleClick = (index) => {
    const newBoard = [...board];
    if (!newBoard[index].isVisible) return;

    newBoard[index].isVisible = false;
    setBoard(newBoard);
    setScore(score + newBoard[index].value);
  };

  return (
    <div>
      <div className="score-display">점수: {score}</div>
      <div className="game-board">
        {board.map((apple, index) => (
          apple.isVisible && (
            <div
              className="apple-container"
              key={index}
              onClick={() => handleAppleClick(index)}
            >
              <img 
                src={appleImages[apple.value] || appleImages.default} 
                alt={`Apple ${apple.value}`} 
                className="apple-image" 
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ClassicMode; 