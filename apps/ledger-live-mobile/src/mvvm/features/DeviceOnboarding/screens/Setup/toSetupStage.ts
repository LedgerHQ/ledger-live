import { DeviceModelId } from "@ledgerhq/types-devices";
import { OnboardingStep } from "@features/platform-device-onboarding";

const modelsWithoutNaming = new Set<DeviceModelId>([
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
]);

export const SetupStageKind = {
  Checks: "checks",
  Naming: "naming",
  Pin: "pin",
  SetupChoice: "setupChoice",
  Security: "security",
  Restore: "restore",
} as const;

export type SetupStageKind = (typeof SetupStageKind)[keyof typeof SetupStageKind];

export type SetupIndicator = "none" | "loading" | "success";

export type SetupStage = {
  index: number;
  total: number;
  kind: SetupStageKind;
  indicator: SetupIndicator;
  detail?: "recoveryKey";
};

const touchOrder = [
  SetupStageKind.Checks,
  SetupStageKind.Naming,
  SetupStageKind.Pin,
  SetupStageKind.SetupChoice,
  SetupStageKind.Security,
] as const;

const nanoOrder = [
  SetupStageKind.Checks,
  SetupStageKind.Pin,
  SetupStageKind.SetupChoice,
  SetupStageKind.Security,
] as const;

const setupKindByState = new Map<string, SetupStageKind>([
  ["deviceSetup.naming", SetupStageKind.Naming],
  ["deviceSetup.pin", SetupStageKind.Pin],
  ["deviceSetup.setupChoice", SetupStageKind.SetupChoice],
  ["deviceSetup.newSeed", SetupStageKind.Security],
  ["deviceSetup.backupRecoveryKey", SetupStageKind.Security],
  ["deviceSetup.restoreChoice", SetupStageKind.Restore],
  ["deviceSetup.restoreWords", SetupStageKind.Restore],
  ["deviceSetup.restoreRecover", SetupStageKind.Restore],
  ["deviceSetup.restoreRecoveryKey", SetupStageKind.Restore],
]);

const hiddenSetupStates = new Set(["deviceSetup.waiting"]);

const finalSlot = SetupStageKind.Security;

function stageOrder(modelId: DeviceModelId): readonly SetupStageKind[] {
  return modelsWithoutNaming.has(modelId) ? nanoOrder : touchOrder;
}

function slotOf(kind: SetupStageKind) {
  return kind === SetupStageKind.Restore ? finalSlot : kind;
}

function safetyWarningHidesStage(machineState: string, currentStep: string | null) {
  return currentStep === OnboardingStep.SafetyWarning && machineState.startsWith("deviceSetup.");
}

function checksIndicator(machineState: string): SetupIndicator {
  if (machineState === "checks.checksSucceeded") return "success";
  return "loading";
}

export function toSetupStage(input: {
  machineState: string;
  currentStep: string | null;
  modelId: DeviceModelId;
}): SetupStage | null {
  if (safetyWarningHidesStage(input.machineState, input.currentStep)) return null;
  if (hiddenSetupStates.has(input.machineState)) return null;

  const kind = input.machineState.startsWith("checks.")
    ? SetupStageKind.Checks
    : setupKindByState.get(input.machineState);
  if (!kind) return null;

  const order = stageOrder(input.modelId);
  const index = order.indexOf(slotOf(kind));
  if (index < 0) return null;

  const indicator = kind === SetupStageKind.Checks ? checksIndicator(input.machineState) : "none";
  const detail = input.machineState === "deviceSetup.backupRecoveryKey" ? "recoveryKey" : undefined;

  return detail
    ? { index, total: order.length, kind, indicator, detail }
    : { index, total: order.length, kind, indicator };
}
