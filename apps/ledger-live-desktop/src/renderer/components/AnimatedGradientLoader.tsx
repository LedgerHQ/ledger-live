import React from "react";
import styled, { keyframes } from "styled-components";

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
`;

const LoaderContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const GradientBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 60%;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    to top,
    rgba(139, 128, 219, 0.4) 0%,
    rgba(139, 128, 219, 0.2) 40%,
    rgba(139, 128, 219, 0.05) 70%,
    transparent 100%
  );
  border-radius: ${p => p.theme.radii[2]}px;
  animation: ${pulseAnimation} 2.5s ease-in-out infinite;
`;

const LoaderText = styled.div`
  position: relative;
  z-index: 1;
  font-family: "Brut Grotesque", sans-serif;
  font-weight: 500;
  font-size: 22px;
  color: #ffffff;
  text-align: center;
  max-width: 100%;
`;

export const AnimatedGradientLoader: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <LoaderContainer>
      <LoaderText>{children}</LoaderText>
      <GradientBackground />
    </LoaderContainer>
  );
};
