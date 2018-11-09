// @flow

import type { Step } from "./types";

type StepsByMode = {
  full: Step[],
  alreadyInitialized: Step[],
  qrcode: Step[],
};

const steps: StepsByMode = {
  full: [
    { id: "OnboardingStepGetStarted", isGhost: true },
    { id: "OnboardingStepChooseDevice" },
    { id: "OnboardingStepSetupPin" },
    { id: "OnboardingStepWriteRecovery" },
    { id: "OnboardingStepSecurityChecklist" },
    { id: "OnboardingStepPairNew" },
    { id: "OnboardingStepPassword" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
  alreadyInitialized: [
    { id: "OnboardingStepGetStarted", isGhost: true },
    { id: "OnboardingStepChooseDevice" },
    { id: "OnboardingStepSecurityChecklist" },
    { id: "OnboardingStepPairNew" },
    { id: "OnboardingStepPassword" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
  qrcode: [
    { id: "OnboardingStepGetStarted", isGhost: true },
    { id: "OnboardingStepScanQR" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
};

export default steps;
