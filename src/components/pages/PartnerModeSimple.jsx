import React, { useState, useRef, useCallback, useEffect } from 'react';
import '../styles/ClassicMode.css';
import AppleDefault from '../../images/appleDefault.svg';
import Apple1 from '../../images/apple1.svg';
import Apple2 from '../../images/apple2.svg';
import Apple3 from '../../images/apple3.svg';
import Apple4 from '../../images/apple4.svg';
import Apple5 from '../../images/apple5.svg';
import Apple6 from '../../images/apple6.svg';
import Apple7 from '../../images/apple7.svg';
import Apple8 from '../../images/apple8.svg';
import Apple9 from '../../images/apple9.svg';

const PartnerModeSimple = ({ onBack }) => {
    // 게임 설정 (ClassicMode와 동일)
    const BOARD_SIZE_X = 15; // 가로 칸 수
    const BOARD_SIZE_Y = 10; // 세로 칸 수
    const TARGET_SUM = 10;

    // 게임 상태
    const [gameState, setGameState] = useState('lobby');
    const [playerName, setPlayerName] = useState('');
    const [gameBoard, setGameBoard] = useState([]);
    const [score, setScore] = useState(0);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedCells, setSelectedCells] = useState([]);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    
    const gameBoardRef = useRef(null);
    const selectionBoxRef = useRef(null);
    const mouseIsDownRef = useRef(false);

    // 숫자별 사과 이미지 매핑 (ClassicMode와 동일)
    const appleImages = {
        1: Apple1,
        2: Apple2,
        3: Apple3,
        4: Apple4,
        5: Apple5,
        6: Apple6,
        7: Apple7,
        8: Apple8,
        9: Apple9,
        default: AppleDefault
    };

    // 드래그 방지 함수들
    const preventDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const preventContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    // 랜덤 숫자 생성 (1~9, ClassicMode와 동일)
    const getRandomAppleValue = () => {
        return Math.floor(Math.random() * 9) + 1;
    };

    // 게임 보드 생성 (ClassicMode와 동일)
    const generateBoard = () => {
        console.log('generateBoard 호출됨');
        const newBoard = Array(BOARD_SIZE_Y).fill().map(() => 
            Array(BOARD_SIZE_X).fill().map(() => ({
                value: getRandomAppleValue(),
                isVisible: true
            }))
        );
        
        console.log('새 보드 생성:', newBoard.length, 'x', newBoard[0]?.length);
        setGameBoard(newBoard);
    };    // 게임 초기화
    const initGame = () => {
        console.log('initGame 호출됨');
        setScore(0);
        setSelectedCells([]);
        generateBoard();
    };

    // 전역 마우스 업 이벤트 핸들러
    const handleGlobalMouseUp = useCallback((e) => {
        mouseIsDownRef.current = false;
        
        if (isSelecting) {
            handleMouseUp(e);
        }
    }, [isSelecting]);

    // 선택 상자 생성
    const createSelectionBox = (x, y) => {
        if (selectionBoxRef.current) {
            selectionBoxRef.current.remove();
        }
        
        const selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box';
        selectionBox.style.position = 'absolute';
        selectionBox.style.left = `${x}px`;
        selectionBox.style.top = `${y}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.border = '2px solid #007bff';
        selectionBox.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        selectionBox.style.pointerEvents = 'none';
        selectionBox.style.zIndex = '1000';
        
        gameBoardRef.current.appendChild(selectionBox);
        selectionBoxRef.current = selectionBox;
    };

    // 선택 상자 업데이트
    const updateSelectionBox = (currentX, currentY) => {
        if (!selectionBoxRef.current) return;
        
        const left = Math.min(startPos.x, currentX);
        const top = Math.min(startPos.y, currentY);
        const width = Math.abs(currentX - startPos.x);
        const height = Math.abs(currentY - startPos.y);
        
        selectionBoxRef.current.style.left = `${left}px`;
        selectionBoxRef.current.style.top = `${top}px`;
        selectionBoxRef.current.style.width = `${width}px`;
        selectionBoxRef.current.style.height = `${height}px`;
    };

    // 선택된 셀 업데이트
    const updateSelectedCells = () => {
        if (!selectionBoxRef.current || !gameBoardRef.current) return;
        
        const selectionRect = selectionBoxRef.current.getBoundingClientRect();
        const boardRect = gameBoardRef.current.getBoundingClientRect();
        
        const cells = gameBoardRef.current.querySelectorAll('.apple-cell');
        const newSelectedCells = [];
        
        cells.forEach((cell, index) => {
            const cellRect = cell.getBoundingClientRect();
            
            if (cellRect.left < selectionRect.right &&
                cellRect.right > selectionRect.left &&
                cellRect.top < selectionRect.bottom &&
                cellRect.bottom > selectionRect.top) {
                
                const row = Math.floor(index / BOARD_SIZE_X);
                const col = index % BOARD_SIZE_X;
                
                if (gameBoard[row] && gameBoard[row][col] && gameBoard[row][col].isVisible) {
                    newSelectedCells.push({ row, col, value: gameBoard[row][col].value });
                    cell.classList.add('selected');
                }
            } else {
                cell.classList.remove('selected');
            }
        });
        
        setSelectedCells(newSelectedCells);
    };

    // 선택 검증
    const checkSelection = () => {
        if (selectedCells.length === 0) return;
        
        const sum = selectedCells.reduce((acc, cell) => acc + cell.value, 0);
        
        if (sum === TARGET_SUM) {
            // 선택된 사과들 제거
            const newBoard = [...gameBoard];
            selectedCells.forEach(({ row, col }) => {
                newBoard[row][col].isVisible = false;
            });
            
            setGameBoard(newBoard);
            setScore(prevScore => prevScore + selectedCells.length * 10);
            
            console.log(`사과 ${selectedCells.length}개 제거, 점수: ${selectedCells.length * 10}점 획득`);
        }
    };

    // 마우스 다운 이벤트
    const handleMouseDown = (e) => {
        if (e.button === 2) return;
        if (gameState !== 'playing') return;
        
        mouseIsDownRef.current = true;
        
        const boardRect = gameBoardRef.current.getBoundingClientRect();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        
        setIsSelecting(true);
        setSelectedCells([]);
        setStartPos({ x, y });
        
        createSelectionBox(x, y);
        e.stopPropagation();
    };

    // 마우스 이동 이벤트
    const handleMouseMove = (e) => {
        if (!isSelecting || !mouseIsDownRef.current) return;
        
        const boardRect = gameBoardRef.current.getBoundingClientRect();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        
        updateSelectionBox(x, y);
        updateSelectedCells();
        
        e.preventDefault();
        e.stopPropagation();
    };

    // 선택 상태 정리
    const cleanupSelection = () => {
        document.querySelectorAll('.apple-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        if (selectionBoxRef.current) {
            selectionBoxRef.current.remove();
            selectionBoxRef.current = null;
        }
        
        mouseIsDownRef.current = false;
        setIsSelecting(false);
        setSelectedCells([]);
    };

    // 마우스 업 이벤트
    const handleMouseUp = (e) => {
        if (!isSelecting) return;
        
        checkSelection();
        cleanupSelection();
    };

    // 컴포넌트 마운트 시 이벤트 리스너 등록
    useEffect(() => {
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('contextmenu', preventContextMenu);
        
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('contextmenu', preventContextMenu);
        };
    }, [handleGlobalMouseUp]);

    // 로비 화면 렌더링
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
                    <button 
                        onClick={() => {
                            if (playerName.trim()) {
                                setGameState('playing');
                                initGame();
                            } else {
                                alert('닉네임을 입력해주세요!');
                            }
                        }}
                        disabled={!playerName.trim()}
                    >
                        게임 시작
                    </button>
                </div>
                <div className="status-message">ClassicMode와 동일한 15x10 보드</div>
                <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px' }}>
                    뒤로가기
                </button>
            </div>
        </div>
    );

    // 게임 화면 렌더링 (ClassicMode와 동일한 스타일)
    const renderGame = () => (
        <div className="classic-mode">
            <div className="game-header">
                <div className="header-left">
                    <button onClick={onBack} className="back-btn">◀ 뒤로</button>
                    <div className="player-info">
                        <span>플레이어: {playerName}</span>
                    </div>
                </div>
                <div className="header-center">
                    <h1>사과 상자 게임 - 협동모드 (Simple)</h1>
                </div>
                <div className="header-right">
                    <div className="score">점수: {score.toLocaleString()}점</div>
                </div>
            </div>

            <div className="game-content">
                <div className="game-info">
                    <div className="instruction">
                        마우스로 드래그하여 합이 10이 되는 사과들을 선택하세요!
                    </div>
                </div>

                <div 
                    className="game-board"
                    ref={gameBoardRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onDragStart={preventDrag}
                    onContextMenu={preventContextMenu}
                    style={{
                        gridTemplateColumns: `repeat(${BOARD_SIZE_X}, 1fr)`,
                        gridTemplateRows: `repeat(${BOARD_SIZE_Y}, 1fr)`
                    }}
                >
                    {gameBoard.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`apple-cell ${!cell.isVisible ? 'removed' : ''}`}
                                onDragStart={preventDrag}
                            >
                                {cell.isVisible && (
                                    <img
                                        src={appleImages[cell.value] || appleImages.default}
                                        alt={`Apple ${cell.value}`}
                                        className="apple-image"
                                        draggable={false}
                                        onDragStart={preventDrag}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="selected-info">
                    {selectedCells.length > 0 && (
                        <div>
                            선택된 사과: {selectedCells.map(cell => cell.value).join(' + ')} = {selectedCells.reduce((sum, cell) => sum + cell.value, 0)}
                            {selectedCells.reduce((sum, cell) => sum + cell.value, 0) === TARGET_SUM && 
                                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}> ✓ 정답!</span>
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="partner-mode">
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'green', color: 'white', padding: '5px', zIndex: 9999 }}>
                Simple PartnerMode (15x10 Board)
            </div>
            {gameState === 'lobby' ? renderLobby() : renderGame()}
        </div>
    );
};

export default PartnerModeSimple;
