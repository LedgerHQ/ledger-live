import { MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "../domain";

export const GRADIENT_COLORS = {
  SUCCESS: "rgba(110, 178, 96, 1)",
  WARNING: "rgba(99, 88, 183, 1)",
  DEFAULT: "rgba(248, 163, 37, 1)",
} as const;

export const getGradientColor = <Step extends string>(
  currentStep: Step,
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
