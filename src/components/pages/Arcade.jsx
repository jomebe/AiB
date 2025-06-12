import React, { useState } from 'react';
import '../styles/ArcadeMode.css';
import ArcadeMode from './ArcadeMode';
import Apple1 from '../../images/apple1.svg';
import Apple2 from '../../images/apple2.svg';
import Apple3 from '../../images/apple3.svg';
import Apple7 from '../../images/apple7.svg';
import Apple8 from '../../images/apple8.svg';
import Apple9 from '../../images/apple9.svg';
import GoldenApple from '../../images/goldenapple.svg';

function Arcade({ onBack }) {
  const [selectedMode, setSelectedMode] = useState(null);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const renderModeSelection = () => {
    return (
      <div className="mode-selection-container">
        <div className="mode-card" onClick={() => handleModeSelect('tetple')}>
          <div className="apple-grid tetple-grid">
            <div className="apple-item"><img src={Apple3} alt="3" /></div>
            <div className="apple-item"><img src={Apple7} alt="7" /></div>
            <div className="apple-item"><img src={Apple8} alt="8" /></div>
          </div>
          <div className="mode-title">Tetple</div>
        </div>

        <div className="mode-card" onClick={() => handleModeSelect('partner')}>
          <div className="apple-grid partner-grid">
            <div className="apple-item"><img src={Apple1} alt="1" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" /></div>
          </div>
          <div className="mode-title">Partner</div>
        </div>

        <div className="mode-card" onClick={() => handleModeSelect('allClear')}>
          <div className="apple-grid all-clear-grid">
            <div className="apple-item"><img src={Apple1} alt="1" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" /></div>
            <div className="apple-item faded"><img src={Apple9} alt="9" /></div>
          </div>
          <div className="mode-title">Apple All Clear</div>
        </div>

        <div className="mode-card" onClick={() => handleModeSelect('golden')}>
          <div className="apple-grid golden-grid">
            <div className="apple-item golden"><img src={GoldenApple} alt="Golden Apple" /></div>
          </div>
          <div className="mode-title">Golden Apple</div>
        </div>
      </div>
    );
  };

  const renderGameContent = () => {
    switch(selectedMode) {
      case 'tetple':
      case 'partner':
      case 'allClear':
      case 'golden':
        return <ArcadeMode mode={selectedMode} onBack={() => setSelectedMode(null)} />;
      default:
        return renderModeSelection();
    }
  };

  return (
    <div className="arcade-container">
      <div className="game-container">
        {renderGameContent()}
      </div>
      {selectedMode && (
        <button className="back-button" onClick={() => setSelectedMode(null)}>
          모드 선택으로 돌아가기
        </button>
      )}
      <button className="back-button" onClick={onBack}>메인으로 돌아가기</button>
    </div>
  );
}

export default Arcade; 