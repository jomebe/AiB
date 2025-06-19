import ApiClient from './api';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.listeners = [];
        this.loadUserFromStorage();
    }

    // 로컬 스토리지에서 사용자 정보 로드
    loadUserFromStorage() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                ApiClient.setToken(token);
            } catch (error) {
                console.error('Failed to parse user data:', error);
                this.logout();
            }
        }
    }

    // 사용자 상태 변경 리스너 추가
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    // 리스너들에게 상태 변경 알림
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentUser));
    }

    // 회원가입
    async register(playerName, password = null) {
        try {
            const response = await ApiClient.register(playerName, password);
            
            if (response.success) {
                this.currentUser = response.player;
                ApiClient.setToken(response.token);
                localStorage.setItem('userData', JSON.stringify(response.player));
                this.notifyListeners();
                return response;
            }
            throw new Error(response.message || '회원가입에 실패했습니다.');
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    // 로그인
    async login(playerName, password = null) {
        try {
            const response = await ApiClient.login(playerName, password);
            
            if (response.success) {
                this.currentUser = response.player;
                ApiClient.setToken(response.token);
                localStorage.setItem('userData', JSON.stringify(response.player));
                this.notifyListeners();
                return response;
            }
            throw new Error(response.message || '로그인에 실패했습니다.');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    // 로그아웃
    async logout() {
        try {
            if (this.currentUser) {
                await ApiClient.logout();
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            this.currentUser = null;
            ApiClient.setToken(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            this.notifyListeners();
        }
    }

    // 현재 사용자 정보 반환
    getCurrentUser() {
        return this.currentUser;
    }

    // 로그인 상태 확인
    isAuthenticated() {
        return !!this.currentUser;
    }

    // 사용자 이름 반환
    getPlayerName() {
        return this.currentUser?.playerName || null;
    }

    // 사용자 ID 반환
    getPlayerId() {
        return this.currentUser?.id || null;
    }
}

export default new AuthService();
