import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Apple = styled.div`
  width: 50px;
  height: 50px;
  background-color: #ff5252;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  cursor: pointer;
  user-select: none;
`;

const ScoreDisplay = styled.div`
  font-size: 24px;
  margin-bottom: 20px;
`;

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
      <ScoreDisplay>Score: {score}</ScoreDisplay>
      <GameBoard>
        {board.map((apple, index) => (
          apple.isVisible && (
            <Apple
              key={index}
              onClick={() => handleAppleClick(index)}
            >
              {apple.value}
            </Apple>
          )
        ))}
      </GameBoard>
    </div>
  );
};

export default ClassicMode;
