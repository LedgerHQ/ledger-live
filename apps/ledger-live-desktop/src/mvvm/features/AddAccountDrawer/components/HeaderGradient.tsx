import { Box } from "@ledgerhq/react-ui/index";
import React from "react";
import styled from "styled-components";
import { WARNING_REASON, type WarningReason } from "../domain";

const GradientContainer = styled.div`
  width: 500px;
  height: 395px;
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -2;
  background: linear-gradient(
    ${p => (p.theme.colors.type === "light" ? "rgba(255, 255, 255, 0)" : "rgba(29, 28, 31, 0)")},
    ${p => (p.theme.colors.type === "light" ? "rgba(255, 255, 255, 1)" : "rgba(29, 28, 31, 1)")}
  );
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

interface HeaderGradientProps<Step> {
  currentStep: Step;
  stepsWithGradient: ReadonlyArray<Step>;
  warningReason?: WarningReason;
  getGradientColor: (currentStep: Step, noAssociatedAccounts: boolean) => string;
}

const HeaderGradient = <Step,>({
  currentStep,
  stepsWithGradient,
  warningReason,
  getGradientColor,
}: HeaderGradientProps<Step>) => {
  const shouldShowGradient = stepsWithGradient.includes(currentStep);

  if (!shouldShowGradient) {
    return null;
  }

  const noAssociatedAccounts = warningReason === WARNING_REASON.NO_ASSOCIATED_ACCOUNTS;
  const gradientColor = getGradientColor(currentStep, noAssociatedAccounts);

  return (
    <Box position="absolute" top={0} left={0} zIndex={-1} style={{ pointerEvents: "none" }}>
      <GradientContainer />
      <GradientInner $gradientColor={gradientColor} />
    </Box>
  );
};

export default HeaderGradient;
