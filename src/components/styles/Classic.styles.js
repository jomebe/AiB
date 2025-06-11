import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background: #DDF5D1;
  font-family: "Wanted Sans Variable", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  padding: 40px 20px;
`;

export const Title = styled.h1`
  font-size: 60px;
  font-weight: 700;
  color: #F2FDEF;
  margin-bottom: 40px;
  text-align: center;
  letter-spacing: -0.02em;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
`;

export const BackButton = styled.button`
  background: #F2FDEF;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 40px;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-4px);
  }
`;

export const GameContainer = styled.div`
  width: 90%;
  max-width: 1200px;
  background: #F2FDEF;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  min-height: 600px;
`; 