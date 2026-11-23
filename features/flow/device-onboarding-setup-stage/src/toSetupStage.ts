import { DeviceModelId } from "@ledgerhq/types-devices";
import { asChecksState, OnboardingStep } from "@features/platform-device-onboarding";
import { toSetupInfoCard, type SetupInfoCard } from "@features/flow-device-onboarding-setup-info";

const modelsWithoutNaming = new Set<DeviceModelId>([
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
]);

export const SetupStageKind = {
  Checks: "checks",
  Genuine: "genuine",
  Naming: "naming",
  Pin: "pin",
  SetupChoice: "setupChoice",
  Security: "security",
  Restore: "restore",
  OsCheck: "osCheck",
} as const;

export type SetupStageKind = (typeof SetupStageKind)[keyof typeof SetupStageKind];

export type SetupIndicator = "none" | "loading" | "success";

export type SetupStageDetail = "recoveryKey" | "recoveryPhrase";

export type SetupStage = {
  index: number;
  total: number;
  kind: SetupStageKind;
  indicator: SetupIndicator;
  detail?: SetupStageDetail;
  infoCard?: SetupInfoCard;
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
  SetupStageKind.SetupChoice,
  SetupStageKind.Pin,
  SetupStageKind.Security,
] as const;

/** A Nano that can only update its OS once seeded checks the OS version last. */
const nanoUpdateAfterSetupOrder = [
  SetupStageKind.Genuine,
  SetupStageKind.SetupChoice,
  SetupStageKind.Pin,
  SetupStageKind.Security,
  SetupStageKind.OsCheck,
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

const detailByState = new Map<string, SetupStageDetail>([
  ["deviceSetup.backupRecoveryKey", "recoveryKey"],
  ["deviceSetup.restoreWords", "recoveryPhrase"],
]);

const hiddenSetupStates = new Set(["deviceSetup.waiting"]);

const finalSlot = SetupStageKind.Security;

const checkKinds = new Set<SetupStageKind>([
  SetupStageKind.Checks,
  SetupStageKind.Genuine,
  SetupStageKind.OsCheck,
]);

function stageOrder(modelId: DeviceModelId, updateAfterSetup: boolean) {
  if (!modelsWithoutNaming.has(modelId)) return touchOrder;
  return updateAfterSetup ? nanoUpdateAfterSetupOrder : nanoOrder;
}

function stageKindOf(
  machineState: string,
  order: readonly SetupStageKind[],
  osCheck: boolean,
): SetupStageKind | undefined {
  if (osCheck) return SetupStageKind.OsCheck;
  if (machineState.startsWith("checks.")) return order[0];
  return setupKindByState.get(machineState);
}

function slotOf(kind: SetupStageKind) {
  return kind === SetupStageKind.Restore ? finalSlot : kind;
}

function safetyWarningHidesStage(machineState: string, currentStep: string | null) {
  return currentStep === OnboardingStep.SafetyWarning && machineState.startsWith("deviceSetup.");
}

const finishedChecksStates = new Set([
  "checks.checksSucceeded",
  "checks.checksDone",
  "checks.leavingEarlyCheckScreen",
  "setupExit",
]);

function checksIndicator(machineState: string): SetupIndicator {
  return finishedChecksStates.has(asChecksState(machineState) ?? "") ? "success" : "loading";
}

export function toSetupStage(input: {
  machineState: string;
  currentStep: string | null;
  modelId: DeviceModelId;
  reportsRecoveryKey: boolean;
  /** The Nano holds its OS update until it is seeded. */
  updateAfterSetup?: boolean;
  /** The device is seeded and checks the OS update it held back. */
  osCheck?: boolean;
}): SetupStage | null {
  if (safetyWarningHidesStage(input.machineState, input.currentStep)) return null;
  if (hiddenSetupStates.has(input.machineState)) return null;

  const order: readonly SetupStageKind[] = stageOrder(
    input.modelId,
    input.updateAfterSetup === true,
  );
  const kind = stageKindOf(input.machineState, order, input.osCheck === true);
  if (!kind) return null;

  const index = order.indexOf(slotOf(kind));
  if (index < 0) return null;

  const indicator = checkKinds.has(kind) ? checksIndicator(input.machineState) : "none";
  const detail = detailByState.get(input.machineState);
  const infoCard = toSetupInfoCard(input.machineState, input.reportsRecoveryKey);

  return {
    index,
    total: order.length,
    kind,
    indicator,
    ...(detail ? { detail } : {}),
    ...(infoCard ? { infoCard } : {}),
  };
}
