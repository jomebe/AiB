import ApiClient from './api';
import AuthService from './auth';

class ScoreService {
    constructor() {
        this.gameMode = {
            CLASSIC: 'classic',
            ARCADE: 'arcade',
            PARTNER: 'partner',
            TIME_ATTACK: 'timeattack',
            GOLDEN_APPLE: 'goldenapple'
        };
    }    // 점수 제출
    async submitScore(gameData) {
        console.log('점수 제출 시작:', gameData);
        console.log('인증 상태:', AuthService.isAuthenticated());
        console.log('현재 사용자:', AuthService.getCurrentUser());
        
        if (!AuthService.isAuthenticated()) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const scoreData = {
                score: gameData.score,
                mode: gameData.mode,
                playTime: gameData.playTime,
                applesRemoved: gameData.applesRemoved || 0
            };

            console.log('API로 전송할 데이터:', scoreData);
            const response = await ApiClient.submitScore(scoreData);
            console.log('API 응답:', response);
            
            if (response.success) {
                return {
                    success: true,
                    rank: response.rank,
                    personalBest: response.personalBest,
                    message: response.message
                };
            }
            throw new Error(response.message || '점수 제출에 실패했습니다.');
        } catch (error) {
            console.error('Score submission failed:', error);
            throw error;
        }
    }    // 랭킹 조회
    async getRankings(mode = null, limit = 50, offset = 0) {
        try {
            console.log('ScoreService.getRankings 호출:', { mode, limit, offset });
            
            const params = { limit, offset };
            if (mode) params.mode = mode;

            console.log('API 호출 파라미터:', params);
            const response = await ApiClient.getRankings(params);
            console.log('API 응답:', response);
            
            if (response.success) {
                console.log('성공 응답 데이터:', {
                    rankings: response.rankings,
                    total: response.total,
                    userRank: response.userRank
                });
                return {
                    rankings: response.rankings,
                    total: response.total,
                    userRank: response.userRank
                };
            }
            throw new Error('랭킹 조회에 실패했습니다.');
        } catch (error) {
            console.error('Rankings fetch failed:', error);
            throw error;
        }
    }

    // 전체 랭킹 조회
    async getAllRankings(limit = 20) {
        try {
            const response = await ApiClient.getAllRankings(limit);
            
            if (response.success) {
                return response.rankings;
            }
            throw new Error('전체 랭킹 조회에 실패했습니다.');
        } catch (error) {
            console.error('All rankings fetch failed:', error);
            throw error;
        }
    }

    // 특정 플레이어 랭킹 조회
    async getPlayerRankings(playerName, mode = null) {
        try {
            const params = { playerName };
            if (mode) params.mode = mode;

            const response = await ApiClient.getRankings(params);
            
            if (response.success) {
                return response.rankings;
            }
            throw new Error('플레이어 랭킹 조회에 실패했습니다.');
        } catch (error) {
            console.error('Player rankings fetch failed:', error);
            throw error;
        }
    }

    // 플레이어 통계 조회
    async getPlayerStats() {
        if (!AuthService.isAuthenticated()) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const response = await ApiClient.getPlayerStats();
            
            if (response.success) {
                return {
                    stats: response.stats,
                    achievements: response.achievements
                };
            }
            throw new Error('통계 조회에 실패했습니다.');
        } catch (error) {
            console.error('Player stats fetch failed:', error);
            throw error;
        }
    }

    // 게임 모드별 최고 점수 조회
    async getBestScoreByMode(mode) {
        try {
            const playerName = AuthService.getPlayerName();
            if (!playerName) return null;

            const rankings = await this.getPlayerRankings(playerName, mode);
            if (rankings && rankings.length > 0) {
                return Math.max(...rankings.map(r => r.score));
            }
            return 0;
        } catch (error) {
            console.error('Best score fetch failed:', error);
            return 0;
        }
    }

    // 시간 포맷팅 (초 -> MM:SS)
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'        });
    }
}

const scoreService = new ScoreService();
export default scoreService;
