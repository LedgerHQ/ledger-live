// @flow

import type { Step } from "./types";

type StepsByMode = {
  full: Step[],
  alreadyInitialized: Step[],
};

const steps: StepsByMode = {
  full: [
    { id: "OnboardingStep01Welcome", isGhost: true },
    { id: "OnboardingStep02GetStarted", isGhost: true },
    { id: "OnboardingStep03ChooseDevice" },
    { id: "OnboardingStep04SetupPin" },
    { id: "OnboardingStep05WriteRecovery" },
    { id: "OnboardingStep06SecurityChecklist" },
    { id: "OnboardingStep07PairNew" },
    { id: "OnboardingStep08Password" },
    { id: "OnboardingStep09ShareData" },
    { id: "OnboardingStep10Finish", isGhost: true },
  ],
  alreadyInitialized: [
    { id: "OnboardingStep01Welcome", isGhost: true },
    { id: "OnboardingStep02GetStarted", isGhost: true },
    { id: "OnboardingStep03ChooseDevice" },
    { id: "OnboardingStep06SecurityChecklist" },
    { id: "OnboardingStep07PairNew" },
    { id: "OnboardingStep08Password" },
    { id: "OnboardingStep09ShareData" },
    { id: "OnboardingStep10Finish", isGhost: true },
  ],
};

export default steps;
