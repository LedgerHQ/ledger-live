import type { SnapshotFrom } from "xstate";
import type { deviceOnboardingMachine } from "../machine";
import { firmwareSettled } from "../firmwareCheckState";
import type { DeviceOnboardingContext, OnboardingStep, RecoveryKeyStatus } from "../types";

/**
 * @deprecated Read `toolContext` (the whole context as plain data) instead. Kept while app code
 * still reads these flat names.
 */
export type WatchedOnboardingContext = {
  deviceModelId: DeviceOnboardingContext["deviceModelId"];
  offerSync: boolean;
  isOnboarded: boolean;
  onboardedOnEntry: boolean | null;
  isInRecoveryMode: boolean | null;
  managerAllowed: boolean | null;
  currentOnboardingStep: OnboardingStep | null;
  recoveryKeyStatus: RecoveryKeyStatus | null;
  currentSetupStep: OnboardingStep | null;
  firmwareVersion: string | null;
  availableFirmwareVersion: string | null;
  firmwareChecked: boolean;
  firmwareUpToDate: boolean | null;
  onEarlyCheckScreen: boolean;
  secureConnectionRequested: boolean;
  isGenuine: boolean | null;
  verdictMatchesSession: boolean | null;
  genuineFailureKind: string | null;
  checksPaused: boolean;
};

/**
 * @deprecated Read `toolContext` (the whole context as plain data) instead. Kept while app code
 * still reads these flat names.
 */
export function flattenDeviceOnboardingContext(
  snapshot: SnapshotFrom<typeof deviceOnboardingMachine>,
): WatchedOnboardingContext {
  const { context } = snapshot;
  const verdict = context.genuineVerdict;
  const firmware = context.firmware;

  return {
    deviceModelId: context.deviceModelId,
    offerSync: context.offerSync,
    isOnboarded: context.isOnboarded,
    onboardedOnEntry: context.onboardedOnEntry,
    isInRecoveryMode: context.lastDeviceState?.isInRecoveryMode ?? null,
    managerAllowed: context.lastDeviceState?.managerAllowed ?? null,
    currentOnboardingStep: context.lastDeviceState?.currentOnboardingStep ?? null,
    recoveryKeyStatus: context.lastDeviceState?.recoveryKeyStatus ?? null,
    currentSetupStep: context.currentSetupStep,
    firmwareVersion: context.firmwareVersion,
    availableFirmwareVersion:
      firmware?.kind === "offered" ? firmware.update.finalFirmware.version : null,
    firmwareChecked: firmwareSettled(firmware),
    firmwareUpToDate:
      firmwareSettled(firmware) && firmware.kind !== "deferred"
        ? firmware.kind === "upToDate"
        : null,
    onEarlyCheckScreen: context.onEarlyCheckScreen,
    secureConnectionRequested: snapshot.matches({ checks: { genuineCheck: "awaitingApproval" } }),
    isGenuine: verdict?.isGenuine ?? null,
    verdictMatchesSession: verdict === null ? null : verdict.sessionId === context.sessionId,
    genuineFailureKind: context.lastGenuineFailure?.kind ?? null,
    checksPaused: context.checksPaused,
  };
}
