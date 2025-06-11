import React from 'react';
import { useNavigate } from 'react-router-dom';
import RedApple from '../../images/apples.svg';
import GoldenApple from '../../images/goldenapples.svg';
import {
  Container,
  Title,
  GameModeContainer,
  GameMode,
  AppleIcon,
  ModeName
} from '../styles/Main.styles';

function Main() {
  const navigate = useNavigate();

  const handleClassicMode = () => {
    navigate('/classic');
  };

  const handleArcadeMode = () => {
    navigate('/arcade');
  };

  return (
    <Container>
      <Title>APPLE IS BETTER</Title>
      <GameModeContainer>
        <GameMode onClick={handleClassicMode}>
          <AppleIcon src={RedApple} alt="Classic Mode" />
          <ModeName>classic</ModeName>
        </GameMode>
        <GameMode onClick={handleArcadeMode}>
          <AppleIcon src={GoldenApple} alt="Arcade Mode" />
          <ModeName>arcade</ModeName>
        </GameMode>
      </GameModeContainer>
    </Container>
  );
}

export default Main; 