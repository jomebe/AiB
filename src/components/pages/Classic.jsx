import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  BackButton,
  GameContainer
} from '../styles/Classic.styles';

function Classic() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Container>
      <Title>클래식 모드</Title>
      <BackButton onClick={handleBack}>메인으로 돌아가기</BackButton>
      <GameContainer>
        {/* 클래식 모드 게임 내용이 여기에 들어갑니다 */}
      </GameContainer>
    </Container>
  );
}

export default Classic; 