import { useState } from 'react';
import styled from 'styled-components';
import RedApple from './images/apples.svg';
import GoldenApple from './images/goldenapple.svg';
import ClassicModeSelection from './components/pages/Classic.jsx';
import ArcadeModeSelection from './components/pages/Arcade.jsx';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #DDF5D1;
  font-family: "Wanted Sans Variable", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
`;

const Title = styled.h1`
  font-size: 80px;
  font-weight: 700;
  color:rgb(255, 255, 255);
  margin-bottom: 80px;
  text-align: center;
  letter-spacing: -0.02em;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
`;

const GameModeContainer = styled.div`
  display: flex;
  gap: 24px;
`;

const GameMode = styled.div`
  width: 400px;
  height: 160px;
  background:rgb(255, 255, 255);
  border-radius: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 40px;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-8px);
  }
`;

const AppleIcon = styled.img`
  width: 80px;
  height: 80px;
  margin-right: 24px;
  pointer-events: none;
`;

const ModeName = styled.span`
  font-size: 32px;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.02em;
  pointer-events: none;
`;

function App() {
  const [gameMode, setGameMode] = useState(null);

  const renderContent = () => {
    if (gameMode === 'classic') {
      return <ClassicModeSelection onBack={() => setGameMode(null)} />;
    } else if (gameMode === 'arcade') {
      return <ArcadeModeSelection onBack={() => setGameMode(null)} />;
    } else {
      return (
        <>
          <Title>APPLE IS BETTER</Title>
          <GameModeContainer>
            <GameMode onClick={() => setGameMode('classic')}>
              <AppleIcon src={RedApple} alt="Classic Mode" />
              <ModeName>classic</ModeName>
            </GameMode>
            <GameMode onClick={() => setGameMode('arcade')}>
              <AppleIcon src={GoldenApple} alt="Arcade Mode" />
              <ModeName>arcade</ModeName>
            </GameMode>
          </GameModeContainer>
        </>
      );
    }
  };

  return (
    <Container>
      {renderContent()}
    </Container>
  );
}

export default App;
