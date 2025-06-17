import React, { useState } from 'react';
import '../styles/PartnerMode.css';

const PartnerModeSimple = ({ onBack }) => {
    const [gameState, setGameState] = useState('lobby');
    const [playerName, setPlayerName] = useState('');

    const renderLobby = () => (
        <div className="lobby-container">
            <div className="lobby-content">
                <h1>사과 상자 게임 - 협동모드</h1>
                <div className="nickname-form">
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                        maxLength="10"
                    />
                    <button onClick={() => alert('매칭 기능은 곧 추가됩니다!')}>
                        게임 시작
                    </button>
                </div>
                <div className="status-message">Firebase 연결된 실시간 협동 모드</div>
                <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px' }}>
                    뒤로가기
                </button>
            </div>
        </div>
    );

    return (
        <div className="partner-mode">
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'green', color: 'white', padding: '5px', zIndex: 9999 }}>
                Simple PartnerMode Loaded
            </div>
            {renderLobby()}
        </div>
    );
};

export default PartnerModeSimple;
