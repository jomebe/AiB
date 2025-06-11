import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Classic.css';
import ClassicMode from './ClassicMode';

function Classic() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(null);

  const handleBack = () => {
    navigate('/');
  };

  const handleClassicApple = () => {
    setSelectedMode('classic');
  };

  const handleTimeAttack = () => {
    setSelectedMode('timeAttack');
  };

  const renderModeSelection = () => {
    return (
      <div className="mode-selection-container">
        <div className="mode-card" onClick={handleClassicApple}>
          <div className="apple-grid">
            <div className="apple-item">5</div>
            <div className="apple-item">7</div>
            <div className="apple-item">6</div>
            <div className="apple-item">3</div>
            <div className="apple-item">2</div>
            <div className="apple-item">1</div>
            <div className="apple-item">4</div>
          </div>
          <div className="mode-title">Classic Apple</div>
        </div>
        <div className="mode-card" onClick={handleTimeAttack}>
          <div className="apple-grid time-attack-grid">
            <div className="apple-item">5</div>
            <div className="apple-item">3</div>
            <div className="apple-item">6</div>
            <div className="apple-item">7</div>
            <div className="apple-item">8</div>
            <div className="apple-item">2</div>
            <div className="apple-item">3</div>
            <div className="apple-item">1</div>
            <div className="apple-item">2</div>
          </div>
          <div className="mode-title">Time Attack</div>
        </div>
      </div>
    );
  };

  const renderGameContent = () => {
    switch(selectedMode) {
      case 'classic':
        return <ClassicMode />;
      case 'timeAttack':
        return <div className="time-attack-mode">Time Attack 모드 (개발 중)</div>;
      default:
        return renderModeSelection();
    }
  };

  return (
    <div className="classic-container">
      <h1 className="classic-title">클래식 모드</h1>
      <button className="back-button" onClick={handleBack}>메인으로 돌아가기</button>
      <div className="game-container">
        {renderGameContent()}
      </div>
      {selectedMode && (
        <button className="back-button" onClick={() => setSelectedMode(null)}>
          모드 선택으로 돌아가기
        </button>
      )}
    </div>
  );
}

export default Classic; 