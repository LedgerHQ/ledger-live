import React, { Fragment } from "react";
import styled, { keyframes } from "styled-components";

const waveAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const LoaderContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GradientWave = styled.div`
  position: absolute;
  width: 200%;
  height: 100%;
  left: -50%;
  top: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(187, 176, 255, 0.1) 20%,
    rgba(187, 176, 255, 0.3) 50%,
    rgba(187, 176, 255, 0.1) 80%,
    transparent 100%
  );
  animation: ${waveAnimation} 3s linear infinite;
  mask-image: radial-gradient(ellipse 50% 50% at center, black 0%, transparent 70%);
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
`;

const LoaderText = styled.div`
  position: relative;
  z-index: 1;
  font-family: "Brut Grotesque", sans-serif;
  font-weight: 500;
  font-size: 22px;
  color: #ffffff;
  text-align: center;
  letter-spacing: -0.44px;
  padding: 0 20px;
  max-width: 100%;
`;

export const AnimatedGradientLoader: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Fragment>
      <LoaderContainer>
        <GradientWave />
      </LoaderContainer>
      <LoaderText>{children}</LoaderText>
    </Fragment>
  );
};
