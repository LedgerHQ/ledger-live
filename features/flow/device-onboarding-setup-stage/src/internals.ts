// Private to the package: no barrel re-exports this file.
import type { SetupStageDetail, SetupStageKind } from "./toSetupStage";

export const setupStepperTestIds = {
  stepper: "device-onboarding-setup-stepper",
  stageTitle: "device-onboarding-setup-stage-title",
  stageDescription: "device-onboarding-setup-stage-description",
  stageLoading: "device-onboarding-setup-stage-loading",
  stageSuccess: "device-onboarding-setup-stage-success",
} as const;

export const stageTitleTestId = (kind: SetupStageKind) =>
  `${setupStepperTestIds.stageTitle}-${kind}`;

export const stageDescriptionTestId = (kind: SetupStageKind, detail?: SetupStageDetail) =>
  [setupStepperTestIds.stageDescription, kind, detail].filter(Boolean).join("-");
