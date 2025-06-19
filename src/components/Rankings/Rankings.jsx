import React, { useState, useEffect, useCallback } from 'react';
import ScoreService from '../../utils/scoreService';
import AuthService from '../../utils/auth';
import './Rankings.css';

const Rankings = ({ isOpen, onClose, gameMode = 'classic' }) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const loadRankings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ScoreService.getRankings(gameMode);
      setRankings(data.rankings || []);
    } catch (err) {
      console.error('랭킹 로드 실패:', err);
      setError('랭킹을 불러오는데 실패했습니다.');
      setRankings([]);
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
  }, [isOpen, loadRankings, loadCurrentUser]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="rankings-overlay" onClick={handleClose}>
      <div className="rankings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rankings-header">
          <h2>🏆 랭킹</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className="rankings-content">
          {loading && (
            <div className="loading">
              <p>랭킹을 불러오는 중...</p>
            </div>
          )}
          
          {error && (
            <div className="error">
              <p>{error}</p>
              <button onClick={loadRankings}>다시 시도</button>
            </div>
          )}
          
          {!loading && !error && (
            <div className="rankings-list">
              {rankings.length === 0 ? (
                <div className="no-rankings">
                  <p>아직 등록된 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="ranking-table">
                  <div className="ranking-header-row">
                    <div className="rank-col">순위</div>
                    <div className="name-col">이름</div>
                    <div className="score-col">점수</div>
                    <div className="date-col">날짜</div>
                  </div>
                  {rankings.map((ranking, index) => (
                    <div 
                      key={ranking.id || index} 
                      className={`ranking-row ${
                        currentUser && ranking.username === currentUser.username 
                          ? 'current-user' 
                          : ''
                      }`}
                    >
                      <div className="rank-col">
                        {index + 1}
                        {index === 0 && <span className="gold">🥇</span>}
                        {index === 1 && <span className="silver">🥈</span>}
                        {index === 2 && <span className="bronze">🥉</span>}
                      </div>
                      <div className="name-col">
                        {ranking.username || '익명'}
                      </div>
                      <div className="score-col">
                        {ranking.score?.toLocaleString() || '0'}
                      </div>
                      <div className="date-col">
                        {ranking.created_at 
                          ? new Date(ranking.created_at).toLocaleDateString('ko-KR')
                          : '-'
                        }
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
            {loading ? '새로고침 중...' : '새로고침'}
          </button>
          <button className="close-footer-button" onClick={handleClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Rankings;
