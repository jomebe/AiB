import React, { useState, useEffect } from 'react';
import '../styles/ClassicMode.css';

const ClassicMode = () => {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);

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
              className="apple"
              key={index}
              onClick={() => handleAppleClick(index)}
            >
              {apple.value}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ClassicMode; 