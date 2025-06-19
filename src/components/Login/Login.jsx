import React, { useState, useEffect } from 'react';
import AuthService from '../../utils/auth';
import './Login.css';

const Login = ({ onLoginSuccess, onClose }) => {
    const [playerName, setPlayerName] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!playerName.trim()) {
            setError('플레이어 이름을 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (isRegistering) {
                response = await AuthService.register(playerName.trim(), password || null);
            } else {
                response = await AuthService.login(playerName.trim(), password || null);
            }

            if (response.success) {
                onLoginSuccess && onLoginSuccess(response.player);
                onClose && onClose();
            }
        } catch (error) {
            setError(error.message || '로그인에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setPassword('');
    };

    return (
        <div className="login-overlay">
            <div className="login-modal">
                <div className="login-header">
                    <h2>{isRegistering ? '회원가입' : '로그인'}</h2>
                    {onClose && (
                        <button className="close-button" onClick={onClose}>
                            ×
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="playerName">플레이어 이름</label>
                        <input
                            type="text"
                            id="playerName"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="플레이어 이름을 입력하세요"
                            maxLength={20}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            비밀번호 
                            <span className="optional">(선택사항)</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호 (선택사항)"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? '처리중...' : (isRegistering ? '회원가입' : '로그인')}
                        </button>
                    </div>

                    <div className="toggle-mode">
                        <button 
                            type="button" 
                            onClick={toggleMode}
                            className="toggle-button"
                            disabled={loading}
                        >
                            {isRegistering ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 회원가입'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
