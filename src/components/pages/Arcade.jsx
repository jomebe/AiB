import React, { useState } from 'react';
import '../styles/ArcadeMode.css';
import ArcadeMode from './ArcadeMode';
import GoldenAppleMode from './GoldenAppleMode';
import Apple1 from '../../images/apple1.svg';
import Apple2 from '../../images/apple2.svg';
import Apple3 from '../../images/apple3.svg';
import Apple5 from '../../images/apple5.svg';
import Apple7 from '../../images/apple7.svg';
import Apple8 from '../../images/apple8.svg';
import GoldenApple from '../../images/goldenapple.svg';

function Arcade({ onBack }) {
  const [selectedMode, setSelectedMode] = useState(null);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const handleRankingClick = () => {
    // TODO: 랭킹 모달/페이지 표시 로직
    console.log('랭킹 조회 요청');
  };

  // 드래그 방지 함수
  const preventDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  const renderModeSelection = () => {
    return (
      <>
      <div className="mode-selection-container">
        <div 
          className="mode-card" 
          onClick={() => handleModeSelect('tetple')}
          onDragStart={preventDrag}
        >
          <div className="apple-grid tetple-grid">
            <div className="apple-item"><img src={Apple2} alt="2" draggable="false" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" draggable="false" /></div>
            <div className="apple-item"><img src={Apple5} alt="5" draggable="false" /></div>
            <div className="apple-item"><img src={Apple3} alt="3" draggable="false" /></div>
          </div>
          <div className="mode-title">Tetple</div>
        </div>        <div 
          className="mode-card" 
          onClick={() => handleModeSelect('partner')}
          onDragStart={preventDrag}
        >
          <div className="apple-grid partner-grid">
            <div className="apple-item"><img src={Apple1} alt="1" draggable="false" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" draggable="false" /></div>
            <div className="apple-item"><img src={Apple7} alt="7" draggable="false" /></div>
          </div>
          <div className="mode-title">Partner</div>
        </div>        <div 
          className="mode-card" 
          onClick={() => handleModeSelect('allClear')}
          onDragStart={preventDrag}
        >
          <div className="apple-grid all-clear-grid">
            <div className="apple-item"><img src={Apple8} alt="8" draggable="false" /></div>
            <div className="apple-item"><img src={Apple1} alt="1" draggable="false" /></div>
            <div className="apple-item"><img src={Apple1} alt="1" draggable="false" /></div>
          </div>
          <div className="mode-title">Apple All Clear</div>
        </div>

        <div 
          className="mode-card" 
          onClick={() => handleModeSelect('golden')}
          onDragStart={preventDrag}
        >
          <div className="apple-grid golden-grid">
            <div className="apple-item golden"><img src={GoldenApple} alt="Golden Apple" draggable="false" /></div>
          </div>
          <div className="mode-title">Golden Apple</div>
        </div>
      </div>
      <button onClick={onBack} className="back-button">
        돌아가기
      </button>
      </>
    );
  };
  const renderGameContent = () => {
    switch(selectedMode) {
      case 'golden':
        return <GoldenAppleMode onBack={() => setSelectedMode(null)} />;
      case 'tetple':
      case 'partner':
      case 'allClear':
        return <ArcadeMode mode={selectedMode} onBack={() => setSelectedMode(null)} />;
      default:
        return renderModeSelection();
    }
  };

  return (
    <div 
      className="arcade-container"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="game-container">
        {renderGameContent()}
      </div>
      <div className="button-container">
        {selectedMode && (
          <button className="back-button" onClick={() => setSelectedMode(null)}>
            모드 선택으로 돌아가기
          </button>
        )}
        <button className="back-button" onClick={onBack}>메인으로 돌아가기</button>
      </div>
      
      {/* 랭킹 버튼 */}
      {!selectedMode && (
        <button className="ranking-button" onClick={handleRankingClick}>
          <span className="trophy-icon">🏆</span>
        </button>
      )}
    </div>
  );
}

export default Arcade;