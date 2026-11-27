// Private to the package: no barrel re-exports this file.
import type { SetupStageKind } from "./toSetupStage";

export const setupStepperTestIds = {
  stepper: "device-onboarding-setup-stepper",
  stageTitle: "device-onboarding-setup-stage-title",
  stageLoading: "device-onboarding-setup-stage-loading",
  stageSuccess: "device-onboarding-setup-stage-success",
} as const;

export const stageTitleTestId = (kind: SetupStageKind) =>
  `${setupStepperTestIds.stageTitle}-${kind}`;
