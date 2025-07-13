import React, { useState } from 'react';
import '../styles/Classic.css';
import ClassicMode from './ClassicMode';
import TimeAttackMode from './TimeAttackMode';
import Rankings from '../Rankings/Rankings';
import Apple1 from '../../images/apple1.svg';
import Apple2 from '../../images/apple2.svg';
import Apple3 from '../../images/apple3.svg';
import Apple4 from '../../images/apple4.svg';
import Apple5 from '../../images/apple5.svg';
import Apple6 from '../../images/apple6.svg';
import Apple7 from '../../images/apple7.svg';

function Classic({ onBack }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [showRankings, setShowRankings] = useState(false);
  const [rankingsRefreshTrigger, setRankingsRefreshTrigger] = useState(0);

  const handleClassicApple = () => {
    setSelectedMode('classic');
  };

  const handleTimeAttack = () => {
    setSelectedMode('timeAttack');
  };

  const handleRankings = () => {
    setShowRankings(true);
  };

  // 점수 제출 성공 시 랭킹 새로고침 트리거
  const triggerRankingsRefresh = () => {
    setRankingsRefreshTrigger(prev => prev + 1);
  };

  // 점수 제출 성공 시 랭킹 새로고침
  const handleScoreSubmitted = (scoreData) => {
    console.log('점수 제출 성공, 랭킹 새로고침 예약');
    
    // 서버 새로고침만 사용 (즉시 업데이트는 제거)
    triggerRankingsRefresh();
  };

  // 선택된 모드에 따라 컴포넌트 렌더링
  if (selectedMode === 'classic') {
    return <ClassicMode 
      onBack={() => setSelectedMode(null)} 
      onScoreSubmitted={handleScoreSubmitted}
      onShowRankings={() => setShowRankings(true)}
    />;
  }
  
  if (selectedMode === 'timeAttack') {
    return <TimeAttackMode 
      onBack={() => setSelectedMode(null)} 
      onScoreSubmitted={handleScoreSubmitted}
    />;
  }

  const renderModeSelection = () => {
    return (
      <div className="mode-selection-container">        <div className="mode-card" onClick={handleClassicApple}>
          <div className="apple-grid classic-grid">
            <div className="apple-item"><img src={Apple3} alt="3" /></div>
            <div className="apple-item"><img src={Apple5} alt="5" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" /></div>
            <div className="apple-item"><img src={Apple7} alt="7" /></div>
            <div className="apple-item"><img src={Apple1} alt="1" /></div>
            <div className="apple-item"><img src={Apple6} alt="6" /></div>
            <div className="apple-item"><img src={Apple4} alt="4" /></div>
          </div>
          <div className="mode-title">Classic Apple</div>
        </div>
        <div className="mode-card" onClick={handleTimeAttack}>
          <div className="apple-grid time-attack-grid">
            <div className="apple-item"><img src={Apple1} alt="1" /></div>
            <div className="apple-item"><img src={Apple2} alt="2" /></div>
            <div className="apple-item"><img src={Apple3} alt="3" /></div>
            <div className="apple-item"><img src={Apple4} alt="4" /></div>
            <div className="apple-item"><img src={Apple5} alt="5" /></div>
            <div className="apple-item"><img src={Apple6} alt="6" /></div>
            <div className="apple-item"><img src={Apple7} alt="7" /></div>
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
        return <ClassicMode 
          onBack={() => setSelectedMode(null)} 
          onScoreSubmitted={handleScoreSubmitted}
          onShowRankings={() => setShowRankings(true)}
        />;
      case 'timeAttack':
        return <TimeAttackMode 
          onBack={() => setSelectedMode(null)} 
          onScoreSubmitted={handleScoreSubmitted}
        />;
      default:
        return renderModeSelection();
    }
  };
  return (
    <div className="classic-container2">
      <div className="game-container2">
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
      
      {/* 랭킹 버튼 - 모드 선택 화면에서만 표시 */}
      {!selectedMode && (
        <button className="ranking-button" onClick={handleRankings}>
          <span className="trophy-icon">🏆</span>
        </button>
      )}

      {/* 랭킹 모달 */}
      <Rankings 
        isOpen={showRankings}
        onClose={() => setShowRankings(false)}
        onBack={() => setShowRankings(false)}
        gameMode="classic"
        refreshTrigger={rankingsRefreshTrigger}
      />
    </div>
  );
}

export default Classic;