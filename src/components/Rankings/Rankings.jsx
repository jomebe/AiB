import React, { useState, useEffect, useCallback } from 'react';
import ScoreService from '../../utils/scoreService';
import AuthService from '../../utils/auth';
import './Rankings.css';

const Rankings = ({ isOpen, onClose, onBack, gameMode = 'classic' }) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);  const loadRankings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== 랭킹 로딩 시작 ===', gameMode);
      
      // 실제 API 호출
      const data = await ScoreService.getRankings(gameMode);
      console.log('API 응답 데이터:', data);
        if (data && data.rankings) {
        // API 응답 데이터를 올바른 형식으로 변환하고 점수 내림차순 정렬
        const formattedRankings = data.rankings
          .map((item, index) => ({
            _id: `${item.playerName}_${item.timestamp}`,
            username: item.playerName,
            score: item.score,
            gameMode: item.mode,
            createdAt: item.timestamp,
            rank: index + 1, // 정렬 후 순위 재할당
            playTime: item.playTime
          }))
          .sort((a, b) => b.score - a.score) // 점수 내림차순 정렬
          .map((item, index) => ({ ...item, rank: index + 1 })); // 정렬 후 순위 재할당
        
        console.log('포맷된 랭킹 데이터:', formattedRankings);
        setRankings(formattedRankings);
      } else {
        console.log('API 응답이 비어있음, 테스트 데이터 사용');        // API 응답이 없으면 테스트 데이터 사용
        const testData = [
          { _id: '1', username: '테스트유저1', score: 1000, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 1 },
          { _id: '2', username: '테스트유저2', score: 800, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 2 },
          { _id: '3', username: '테스트유저3', score: 600, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 3 }
        ].sort((a, b) => b.score - a.score).map((item, index) => ({ ...item, rank: index + 1 }));
        setRankings(testData);
      }
      
    } catch (err) {
      console.error('랭킹 로드 실패:', err);
      setError('랭킹을 불러오는데 실패했습니다: ' + err.message);
        // 에러 발생 시에도 테스트 데이터 표시
      const testData = [
        { _id: '1', username: '테스트유저1', score: 1000, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 1 },
        { _id: '2', username: '테스트유저2', score: 800, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 2 },
        { _id: '3', username: '테스트유저3', score: 600, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 3 }
      ].sort((a, b) => b.score - a.score).map((item, index) => ({ ...item, rank: index + 1 }));
      setRankings(testData);
    } finally {
      setLoading(false);
    }
  }, [gameMode]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = AuthService.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('사용자 정보 로드 실패:', err);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadRankings();
      loadCurrentUser();
    }
  }, [isOpen, loadRankings, loadCurrentUser]);  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Close button clicked'); // 디버깅용
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    }
  };  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('Overlay clicked'); // 디버깅용
      handleClose(e);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      alert('로그아웃되었습니다.');
      // 로그아웃 후 현재 사용자 정보 업데이트
      setCurrentUser(null);
      // 랭킹을 다시 로드하여 YOU 배지 제거
      loadRankings();
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) {
    return null;
  }
  return (
    <div className="rankings-overlay" onClick={handleOverlayClick}>
      <div className="rankings-modal" onClick={(e) => e.stopPropagation()}>        {/* 헤더 */}
        <div className="rankings-header">
          <div className="header-content">
            {/* <div className="trophy-icon">🏆</div> */}
            <div className="header-text">
              <h2>리더보드</h2>
              <span className="mode-badge">{gameMode.toUpperCase()}</span>
            </div>
          </div>
          <div className="header-buttons">
            {currentUser && (
              <button className="logout-button" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                로그아웃
              </button>
            )}
            <button className="close-button" onClick={handleClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="rankings-content">
          {loading && (
            <div className="loading">
              <div className="loader"></div>
              <p>랭킹을 불러오는 중...</p>
            </div>
          )}
          
          {error && (
            <div className="error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button className="retry-button" onClick={loadRankings}>다시 시도</button>
            </div>
          )}
            {!loading && !error && (
            <div className="rankings-list">
              {rankings.length === 0 ? (
                <div className="no-rankings">
                  <div className="empty-icon">📊</div>
                  <h3>아직 등록된 기록이 없습니다</h3>
                  <p>게임을 플레이하고 점수를 등록해보세요!</p>
                </div>
              ) : (
                <div className="ranking-table">
                  {rankings.map((ranking, index) => (
                    <div 
                      key={ranking.id || index} 
                      className={`ranking-item ${
                        currentUser && ranking.username === currentUser.username 
                          ? 'current-user' 
                          : ''
                      } ${index < 3 ? 'top-three' : ''}`}
                    >
                      <div className="rank-section">
                        <div className={`rank-number ${index < 3 ? 'medal' : ''}`}>
                          {index < 3 ? (
                            <span className="medal-icon">
                              {index === 0 && '🥇'}
                              {index === 1 && '🥈'}
                              {index === 2 && '�'}
                            </span>
                          ) : (
                            index + 1
                          )}
                        </div>
                      </div>
                      
                      <div className="player-section">
                        <div className="player-avatar">
                          {(ranking.username || '익명')[0].toUpperCase()}
                        </div>
                        <div className="player-info">
                          <div className="player-name">
                            {ranking.username || '익명'}
                            {currentUser && ranking.username === currentUser.username && (
                              <span className="you-badge">YOU</span>
                            )}
                          </div>
                          <div className="play-time">
                            {ranking.playTime ? `${ranking.playTime}초` : '플레이 시간 미기록'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="score-section">
                        <div className="score-value">
                          {ranking.score?.toLocaleString() || '0'}
                        </div>
                        <div className="score-label">점수</div>
                      </div>
                      
                      <div className="date-section">
                        <div className="date-value">
                          {ranking.created_at 
                            ? new Date(ranking.created_at).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : '미기록'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="rankings-footer">
          <button className="refresh-button" onClick={loadRankings} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M21 3v5h-5M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {loading ? '새로고침 중...' : '새로고침'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Rankings;
