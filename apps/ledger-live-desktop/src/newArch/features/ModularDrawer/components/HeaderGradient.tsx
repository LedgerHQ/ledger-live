import { Box } from "@ledgerhq/react-ui/index";
import React from "react";
import styled from "styled-components";
import { MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "../types";

const GradientContainer = styled.div`
  width: 500px;
  height: 395px;
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -2;
  background: linear-gradient(rgba(29, 28, 31, 0), rgba(29, 28, 31, 1));
`;

const GradientInner = styled.div<{ $gradientColor: string }>`
  width: 500px;
  height: 395px;
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -3;
  background: linear-gradient(${props => props.$gradientColor}00, ${props => props.$gradientColor});
  opacity: 0.3;
`;

const getGradientColor = (currentStep: string): string => {
  switch (currentStep) {
    case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED:
    default:
      return "rgba(110, 178, 96, 1)";
  }
};

const HeaderGradient = ({ currentStep }: { currentStep: string }) => {
  const shouldShowGradient = currentStep === MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED;

  if (!shouldShowGradient) {
    return null;
  }

  const gradientColor = getGradientColor(currentStep);

  return (
    <Box position="absolute" top={0} left={0} zIndex={-1} style={{ pointerEvents: "none" }}>
      <GradientContainer />
      <GradientInner $gradientColor={gradientColor} />
    </Box>
  );
};

export default HeaderGradient;
