// @flow

import type { Step } from "./types";

type StepsByMode = {
  full: Step[],
  alreadyInitialized: Step[],
  qrcode: Step[],
  restore: Step[],
  legacyNanoS: Step[],
  legacyBlue: Step[],
};

const steps: StepsByMode = {
  full: [
    { id: "OnboardingStepChooseDevice", isGhost: true },
    { id: "OnboardingStepGetStarted" },
    { id: "OnboardingStepSetupPin" },
    { id: "OnboardingStepWriteRecovery" },
    { id: "OnboardingStepSecurityChecklist" },
    { id: "OnboardingStepPairNew" },
    { id: "OnboardingStepPassword" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
  legacyBlue: [
    { id: "OnboardingStepChooseDevice", isGhost: true },
    { id: "OnboardingStepLegacy" },
    { id: "OnboardingStepScanQR" },
    { id: "OnboardingStepPassword" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
  legacyNanoS: [
    { id: "OnboardingStepChooseDevice", isGhost: true },
    { id: "OnboardingStepLegacy" },
    { id: "OnboardingStepScanQR" },
    { id: "OnboardingStepPassword" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
  restore: [
    { id: "OnboardingStepChooseDevice", isGhost: true },
    { id: "OnboardingStepGetStarted" },
    { id: "OnboardingStepSetupPin" },
    { id: "OnboardingStepWriteRecovery" },
    { id: "OnboardingStepSecurityChecklist" },
    { id: "OnboardingStepPairNew" },
    { id: "OnboardingStepPassword" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
  alreadyInitialized: [
    { id: "OnboardingStepChooseDevice", isGhost: true },
    { id: "OnboardingStepGetStarted" },
    { id: "OnboardingStepSecurityChecklist" },
    { id: "OnboardingStepPairNew" },
    { id: "OnboardingStepPassword" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
  qrcode: [
    { id: "OnboardingStepChooseDevice", isGhost: true },
    { id: "OnboardingStepGetStarted" },
    { id: "OnboardingStepScanQR" },
    { id: "OnboardingStepPassword" },
    { id: "OnboardingStepShareData" },
    { id: "OnboardingStepFinish", isGhost: true },
  ],
};

export default steps;
