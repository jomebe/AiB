// API 클라이언트 설정
const API_BASE_URL = 'https://pjtsqq.void.sktr.io/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        // 인증이 필요한 요청에 토큰 추가
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            console.log('API Request:', url, config);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('API Success Response:', data);
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            
            // CORS 에러인 경우 더 명확한 메시지
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error('서버에 연결할 수 없습니다. CORS 설정을 확인해주세요.');
            }
            
            throw error;
        }
    }

    // 인증 관련 API
    async register(playerName, password = null) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ playerName, password })
        });
    }

    async login(playerName, password = null) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ playerName, password })
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    // 점수 제출 API
    async submitScore(scoreData) {
        const requestData = {
            score: scoreData.score,
            mode: scoreData.mode,
            playTime: scoreData.playTime,
            applesRemoved: scoreData.applesRemoved,
            timestamp: new Date().toISOString()
        };
        
        console.log('🚀 점수 제출 API 요청 데이터:', requestData);
        
        const response = await this.request('/scores', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
        
        console.log('📥 점수 제출 API 응답:', response);
        return response;
    }

    // 랭킹 관련 API
    async getRankings(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.mode) queryParams.append('mode', params.mode);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.offset) queryParams.append('offset', params.offset);
        if (params.playerName) queryParams.append('playerName', params.playerName);

        const endpoint = `/rankings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.request(endpoint);
    }

    async getAllRankings(limit = 20) {
        return this.request(`/rankings/all?limit=${limit}`);
    }

    // 플레이어 통계 API
    async getPlayerStats() {
        return this.request('/players/stats');    }
}

const apiClient = new ApiClient();
export default apiClient;
