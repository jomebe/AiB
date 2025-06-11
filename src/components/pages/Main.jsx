import React from 'react';
import { useNavigate } from 'react-router-dom';
import RedApple from '../../images/apples.svg';
import GoldenApple from '../../images/goldenapples.svg';
import '../styles/Main.css';

function Main() {
  const navigate = useNavigate();

  const handleClassicMode = () => {
    navigate('/classic');
  };

  const handleArcadeMode = () => {
    navigate('/arcade');
  };

  return (
    <div className="main-container">
      <h1 className="main-title">APPLE IS BETTER</h1>
      <div className="game-mode-container">
        <div className="game-mode" onClick={handleClassicMode}>
          <img className="apple-icon" src={RedApple} alt="Classic Mode" />
          <span className="mode-name">classic</span>
        </div>
        <div className="game-mode" onClick={handleArcadeMode}>
          <img className="apple-icon" src={GoldenApple} alt="Arcade Mode" />
          <span className="mode-name">arcade</span>
        </div>
      </div>
    </div>
  );
}

export default Main; 