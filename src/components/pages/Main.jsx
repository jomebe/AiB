import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RedApple from '../../images/appleDefault.svg';
import GoldenApple from '../../images/goldenapple.svg';
import AuthService from '../../utils/auth';
import Login from '../Login/Login';
import Rankings from '../Rankings/Rankings';
import '../styles/Main.css';

function Main() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  useEffect(() => {
    // 로그인 상태 확인
    setCurrentUser(AuthService.getCurrentUser());
    
    // 인증 상태 변경 리스너 등록
    const unsubscribe = AuthService.addListener((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  const handleClassicMode = () => {
    navigate('/classic');
  };

  const handleArcadeMode = () => {
    navigate('/arcade');
  };

  const handlePartnerMode = () => {
    navigate('/partner');
  };

  const handleTimeAttackMode = () => {
    navigate('/timeattack');
  };

  const handleGoldenAppleMode = () => {
    navigate('/goldenapple');
  };

  const handleLogin = () => {
    setShowLogin(true);
  };

  const handleLogout = async () => {
    await AuthService.logout();
  };
  const handleShowRankings = () => {
    setShowRankings(true);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowLogin(false);
  };

  const handleCloseRankings = () => {
    setShowRankings(false);
  };

  return (
    <div className="main-container">
      {/* 헤더 영역 */}
      <div className="main-header">
        <div className="user-section">
          {currentUser ? (
            <div className="logged-in-user">
              <span className="welcome-text">안녕하세요, {currentUser.playerName}님!</span>
              <button onClick={handleLogout} className="logout-button">
                로그아웃
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="login-button">
              로그인 / 회원가입
            </button>
          )}
        </div>
        <button onClick={handleShowRankings} className="rankings-button">
          🏆 랭킹
        </button>
      </div>

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
        <div className="game-mode" onClick={handlePartnerMode}>
          <img className="apple-icon" src={RedApple} alt="Partner Mode" />
          <span className="mode-name">partner</span>
        </div>
        <div className="game-mode" onClick={handleTimeAttackMode}>
          <img className="apple-icon" src={RedApple} alt="Time Attack Mode" />
          <span className="mode-name">time attack</span>
        </div>
        <div className="game-mode" onClick={handleGoldenAppleMode}>
          <img className="apple-icon" src={GoldenApple} alt="Golden Apple Mode" />
          <span className="mode-name">golden apple</span>
        </div>
      </div>      {/* 로그인 모달 */}
      {showLogin && (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* 랭킹 모달 */}
      {showRankings && (
        <Rankings 
          isModal={true}
          onBack={handleCloseRankings}
        />
      )}
    </div>
  );
}

export default Main; 