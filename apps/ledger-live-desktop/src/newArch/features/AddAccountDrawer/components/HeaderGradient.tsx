import { Box } from "@ledgerhq/react-ui/index";
import React from "react";
import styled from "styled-components";
import {
  MODULAR_DRAWER_ADD_ACCOUNT_STEP,
  WARNING_REASON,
  type ModularDrawerAddAccountStep,
  type WarningReason,
} from "../domain";

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

const GRADIENT_COLORS = {
  SUCCESS: "rgba(110, 178, 96, 1)",
  WARNING: "rgba(99, 88, 183, 1)",
  DEFAULT: "rgba(248, 163, 37, 1)",
} as const;

const getGradientColor = (
  currentStep: ModularDrawerAddAccountStep,
  noAssociatedAccounts: boolean,
): string => {
  if (currentStep === MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED) {
    return noAssociatedAccounts ? GRADIENT_COLORS.WARNING : GRADIENT_COLORS.SUCCESS;
  }
  if (currentStep === MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING && noAssociatedAccounts) {
    return GRADIENT_COLORS.WARNING;
  }
  return GRADIENT_COLORS.DEFAULT;
};

const STEPS_WITH_GRADIENT = [
  MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING,
  MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED,
] as const;

interface HeaderGradientProps {
  currentStep: ModularDrawerAddAccountStep;
  warningReason?: WarningReason;
}

const HeaderGradient: React.FC<HeaderGradientProps> = ({ currentStep, warningReason }) => {
  const shouldShowGradient = (
    STEPS_WITH_GRADIENT as ReadonlyArray<ModularDrawerAddAccountStep>
  ).includes(currentStep);

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
