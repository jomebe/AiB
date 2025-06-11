import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #DDF5D1;
  font-family: "Wanted Sans Variable", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
`;

export const Title = styled.h1`
  font-size: 80px;
  font-weight: 700;
  color: #F2FDEF;
  margin-bottom: 80px;
  text-align: center;
  letter-spacing: -0.02em;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
`;

export const GameModeContainer = styled.div`
  display: flex;
  gap: 24px;
`;

export const GameMode = styled.div`
  width: 400px;
  height: 160px;
  background: #F2FDEF;
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

export const AppleIcon = styled.img`
  width: 80px;
  height: 80px;
  margin-right: 24px;
`;

export const ModeName = styled.span`
  font-size: 32px;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.02em;
`; 