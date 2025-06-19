import React, { useState, useEffect } from 'react';
import ScoreService from '../../utils/scoreService';
import AuthService from '../../utils/auth';
import './Rankings.css';

const Rankings = ({ onBack, isModal = false }) => {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMode, setSelectedMode] = useState('all');
    const [userRank, setUserRank] = useState(null);
    const [playerStats, setPlayerStats] = useState(null);

    const gameModes = [
        { value: 'all', label: '전체' },
        { value: 'classic', label: '클래식' },
        { value: 'arcade', label: '아케이드' },
        { value: 'partner', label: '협동모드' },
        { value: 'timeattack', label: '타임어택' },
        { value: 'goldenapple', label: '황금사과' }
    ];

    useEffect(() => {
        loadRankings();
        if (AuthService.isAuthenticated()) {
            loadPlayerStats();
        }
    }, [selectedMode]);

    const loadRankings = async () => {
        setLoading(true);
        setError('');

        try {
            let data;
            if (selectedMode === 'all') {
                data = await ScoreService.getAllRankings(50);
                setRankings(data);
                setUserRank(null);
            } else {
                const response = await ScoreService.getRankings(selectedMode, 50);
                setRankings(response.rankings);
                setUserRank(response.userRank);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadPlayerStats = async () => {
        try {
            const stats = await ScoreService.getPlayerStats();
            setPlayerStats(stats);
        } catch (error) {
            console.error('Failed to load player stats:', error);
        }
    };

    const getRankingIcon = (rank) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return rank;
        }
    };

    const getModeLabel = (mode) => {
        const modeMap = {
            classic: '클래식',
            arcade: '아케이드',
            partner: '협동모드',
            timeattack: '타임어택',
            goldenapple: '황금사과'
        };
        return modeMap[mode] || mode;
    };

    const formatPlayTime = (seconds) => {
        return ScoreService.formatTime(seconds);
    };

    const formatDate = (dateString) => {
        return ScoreService.formatDate(dateString);
    };    return (
        <div className={`rankings-container ${isModal ? 'modal-mode' : ''}`}>
            {!isModal && (
                <div className="rankings-header">
                    <button onClick={onBack} className="back-button">
                        ← 돌아가기
                    </button>
                    <h1>랭킹</h1>
                </div>
            )}

            {/* 플레이어 통계 (로그인된 경우) */}
            {AuthService.isAuthenticated() && playerStats && (
                <div className="player-stats-section">
                    <h2>내 통계</h2>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">총 게임수</span>
                            <span className="stat-value">{playerStats.stats.totalGames || 0}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">최고 점수</span>
                            <span className="stat-value">{playerStats.stats.bestScore || 0}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">총 플레이 시간</span>
                            <span className="stat-value">{formatPlayTime(playerStats.stats.totalPlayTime || 0)}</span>
                        </div>
                    </div>
                    {userRank && (
                        <div className="user-rank">
                            현재 {getModeLabel(selectedMode)} 순위: {userRank}위
                        </div>
                    )}
                </div>
            )}

            {/* 모드 선택 */}
            <div className="mode-selector">
                {gameModes.map(mode => (
                    <button
                        key={mode.value}
                        className={`mode-button ${selectedMode === mode.value ? 'active' : ''}`}
                        onClick={() => setSelectedMode(mode.value)}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            {/* 랭킹 리스트 */}
            <div className="rankings-content">
                {loading ? (
                    <div className="loading">랭킹을 불러오는 중...</div>
                ) : error ? (
                    <div className="error">
                        <p>랭킹을 불러오는데 실패했습니다.</p>
                        <p>{error}</p>
                        <button onClick={loadRankings} className="retry-button">
                            다시 시도
                        </button>
                    </div>
                ) : rankings.length === 0 ? (
                    <div className="no-data">
                        아직 등록된 점수가 없습니다.
                    </div>
                ) : (
                    <div className="rankings-list">
                        <div className="rankings-table">
                            <div className="table-header">
                                <div className="col-rank">순위</div>
                                <div className="col-player">플레이어</div>
                                <div className="col-score">점수</div>
                                {selectedMode === 'all' && <div className="col-mode">모드</div>}
                                <div className="col-time">플레이 시간</div>
                                <div className="col-date">날짜</div>
                            </div>
                            
                            {rankings.map((item, index) => (
                                <div 
                                    key={`${item.playerName}-${item.timestamp}-${index}`}
                                    className={`table-row ${
                                        AuthService.getPlayerName() === item.playerName ? 'current-user' : ''
                                    }`}
                                >
                                    <div className="col-rank">
                                        <span className="rank-display">
                                            {getRankingIcon(item.rank)}
                                        </span>
                                    </div>
                                    <div className="col-player">
                                        <span className="player-name">{item.playerName}</span>
                                    </div>
                                    <div className="col-score">
                                        <span className="score-value">{item.score.toLocaleString()}</span>
                                    </div>
                                    {selectedMode === 'all' && (
                                        <div className="col-mode">
                                            <span className="mode-badge">{getModeLabel(item.mode)}</span>
                                        </div>
                                    )}
                                    <div className="col-time">
                                        {formatPlayTime(item.playTime)}
                                    </div>
                                    <div className="col-date">
                                        {formatDate(item.timestamp)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Rankings;
