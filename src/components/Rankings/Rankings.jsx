import React, { useState, useEffect, useCallback } from 'react';
import ScoreService from '../../utils/scoreService';
import AuthService from '../../utils/auth';
import './Rankings.css';

const Rankings = ({ isOpen, onClose, gameMode = 'classic' }) => {
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
        // API 응답 데이터를 올바른 형식으로 변환
        const formattedRankings = data.rankings.map((item, index) => ({
          _id: `${item.playerName}_${item.timestamp}`,
          username: item.playerName,
          score: item.score,
          gameMode: item.mode,
          createdAt: item.timestamp,
          rank: item.rank || index + 1,
          playTime: item.playTime
        }));
        
        console.log('포맷된 랭킹 데이터:', formattedRankings);
        setRankings(formattedRankings);
      } else {
        console.log('API 응답이 비어있음, 테스트 데이터 사용');
        // API 응답이 없으면 테스트 데이터 사용
        const testData = [
          { _id: '1', username: '테스트유저1', score: 1000, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 1 },
          { _id: '2', username: '테스트유저2', score: 800, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 2 },
          { _id: '3', username: '테스트유저3', score: 600, gameMode: 'classic', createdAt: new Date().toISOString(), rank: 3 }
        ];
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
      ];
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
                  <p>게임을 플레이하고 점수를 등록해보세요!</p>
                  
                  {/* 임시 테스트 데이터 */}
                  <div className="test-data" style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                    <p>테스트 데이터:</p>
                    <div className="ranking-table">
                      <div className="ranking-header-row">
                        <div className="rank-col">순위</div>
                        <div className="name-col">이름</div>
                        <div className="score-col">점수</div>
                        <div className="date-col">날짜</div>
                      </div>
                      <div className="ranking-row">
                        <div className="rank-col">1 🥇</div>
                        <div className="name-col">테스트유저1</div>
                        <div className="score-col">1,250</div>
                        <div className="date-col">2024.12.19</div>
                      </div>
                      <div className="ranking-row">
                        <div className="rank-col">2 🥈</div>
                        <div className="name-col">테스트유저2</div>
                        <div className="score-col">980</div>
                        <div className="date-col">2024.12.18</div>
                      </div>
                    </div>
                  </div>
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
