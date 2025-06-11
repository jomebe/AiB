import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Classic.css';
import ClassicMode from './ClassicMode';
import Apple1 from '../../images/apple1.svg';
import Apple2 from '../../images/apple2.svg';
import Apple3 from '../../images/apple3.svg';
import Apple4 from '../../images/apple4.svg';
import Apple5 from '../../images/apple5.svg';
import Apple6 from '../../images/apple6.svg';
import Apple7 from '../../images/apple7.svg';

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
            <div className="apple-item"><img src={Apple5} alt="5" /></div>
            <div className="apple-item"><img src={Apple7} alt="7" /></div>
            <div className="apple-item"><img src={Apple6} alt="6" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" /></div>
            <div className="apple-item"><img src={Apple1} alt="1" /></div>
            <div className="apple-item"><img src={Apple4} alt="4" /></div>
            <div className="apple-item"><img src={Apple3} alt="3" /></div>
          </div>
          <div className="mode-title">Classic Apple</div>
        </div>
        <div className="mode-card" onClick={handleTimeAttack}>
          <div className="apple-grid time-attack-grid">
            <div className="apple-item"><img src={Apple5} alt="5" /></div>
            <div className="apple-item"><img src={Apple3} alt="3" /></div>
            <div className="apple-item"><img src={Apple6} alt="6" /></div>
            <div className="apple-item"><img src={Apple7} alt="7" /></div>
            <div className="apple-item"><img src={Apple2} alt="8" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" /></div>
            <div className="apple-item"><img src={Apple3} alt="3" /></div>
            <div className="apple-item"><img src={Apple1} alt="1" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" /></div>
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
      <div className="game-container">
        {renderGameContent()}
      </div>
      {selectedMode && (
        <button className="back-button" onClick={() => setSelectedMode(null)}>
          모드 선택으로 돌아가기
        </button>
      )}
      <button className="back-button" onClick={handleBack}>메인으로 돌아가기</button>
    </div>
  );
}

export default Classic; 