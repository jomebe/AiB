import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Arcade.css';

function Arcade() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="arcade-container">
      <h1 className="arcade-title">아케이드 모드</h1>
      <button className="back-button" onClick={handleBack}>메인으로 돌아가기</button>
      <div className="game-container">
        {/* 아케이드 모드 게임 내용이 여기에 들어갑니다 */}
      </div>
    </div>
  );
}

export default Arcade; 