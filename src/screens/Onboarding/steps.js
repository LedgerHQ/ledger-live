// @flow
import type { Step } from "./types";

export default (mode: string, firstTimeOnboarding: boolean): Step[] => {
  const steps = [
    { id: "OnboardingStepChooseDevice", isGhost: true },
    { id: "OnboardingStepGetStarted" },
  ];
  if (mode === "qr") {
    steps.push({ id: "OnboardingStepScanQR" });
  } else {
    if (mode === "full" || mode === "restore") {
      steps.push({ id: "OnboardingStepSetupPin" });
      steps.push({ id: "OnboardingStepWriteRecovery" });
    }
    steps.push({ id: "OnboardingStepSecurityChecklist" });
    steps.push({ id: "OnboardingStepPairNew" });
  }
  if (firstTimeOnboarding) {
    steps.push({ id: "OnboardingStepPassword" });
    steps.push({ id: "OnboardingStepShareData" });
  }
  steps.push({ id: "OnboardingStepFinish", isGhost: true });
  return steps;
};
