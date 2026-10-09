import type {
  DeviceManagementKit,
  DeviceModelId,
  DeviceSessionId,
  FirmwareUpdateContext,
  GetOsVersionResponse,
  GenuineCheckDAOutput,
} from "@ledgerhq/device-management-kit";
import type { DeviceOnboardingPorts } from "./ports";

/** Named with the values DMK's decoding returns, so reading one is a membership check and not a translation. */
export const OnboardingStep = {
  WelcomeScreen1: "welcome-screen-1",
  WelcomeScreen2: "welcome-screen-2",
  WelcomeScreen3: "welcome-screen-3",
  WelcomeScreen4: "welcome-screen-4",
  WelcomeScreenReminder: "welcome-screen-reminder",
  OnboardingEarlyCheck: "onboarding-status-check",
  ChooseName: "choose-name",
  Pin: "pin",
  SetupChoice: "setup-choice",
  SetupChoiceRestore: "setup-restore-choice",
  NewDevice: "new-device",
  NewDeviceConfirming: "confirm-new-device",
  RestoreSeed: "restore-recovery-phrase",
  RecoverRestore: "restore-recover-backup",
  RestoreCharon: "restore-with-rk",
  SafetyWarning: "safety-warning",
  Ready: "device-is-ready",
} as const;

export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

export const RecoveryKeyStatus = {
  None: "none",
  Unknown: "unknown",
  Rejected: "rejected",
  Choice: "choice",
  Running: "running",
  Naming: "naming",
  Ready: "ready",
} as const;

export type RecoveryKeyStatus = (typeof RecoveryKeyStatus)[keyof typeof RecoveryKeyStatus];

const recoveryKeyBackupInProgress = new Set<RecoveryKeyStatus>([
  RecoveryKeyStatus.Choice,
  RecoveryKeyStatus.Running,
  RecoveryKeyStatus.Naming,
]);

export function isRecoveryKeyBackupInProgress(status: RecoveryKeyStatus | null): boolean {
  return status !== null && recoveryKeyBackupInProgress.has(status);
}

const recoveryKeyBackupFinished = new Set<RecoveryKeyStatus>([
  RecoveryKeyStatus.None,
  RecoveryKeyStatus.Rejected,
  RecoveryKeyStatus.Ready,
]);

export function isRecoveryKeyBackupFinished(status: RecoveryKeyStatus | null): boolean {
  return status !== null && recoveryKeyBackupFinished.has(status);
}

const welcomeSteps = new Set<OnboardingStep>([
  OnboardingStep.WelcomeScreen1,
  OnboardingStep.WelcomeScreen2,
  OnboardingStep.WelcomeScreen3,
  OnboardingStep.WelcomeScreen4,
  OnboardingStep.WelcomeScreenReminder,
]);

const setupSteps = new Set<OnboardingStep>([
  OnboardingStep.ChooseName,
  OnboardingStep.Pin,
  OnboardingStep.SetupChoice,
  OnboardingStep.SetupChoiceRestore,
  OnboardingStep.NewDevice,
  OnboardingStep.NewDeviceConfirming,
  OnboardingStep.RestoreSeed,
  OnboardingStep.RecoverRestore,
  OnboardingStep.RestoreCharon,
]);

export function isWelcomeStep(step: OnboardingStep): boolean {
  return welcomeSteps.has(step);
}

export function isSetupStep(step: OnboardingStep): boolean {
  return setupSteps.has(step);
}

export type SeedPhraseWordCount = 12 | 18 | 24;

/**
 * Carried untouched so the app can pick a drawer the machine knows nothing about: an unreachable
 * backend and a forced My Ledger provider both arrive as an `HttpFetchApiError`, and only the app
 * holds the provider setting that tells them apart.
 */
export type GenuineCheckFailure = unknown;

export type DeviceOnboardingState = {
  isOnboarded: boolean;
  isInRecoveryMode: boolean;
  managerAllowed: boolean;
  currentOnboardingStep: OnboardingStep;
  seedWordIndex: number;
  seedPhraseWordCount: SeedPhraseWordCount;
  recoveryKeyStatus: RecoveryKeyStatus | null;
};

const recoveryKeyScreenSteps = new Set<OnboardingStep>([
  OnboardingStep.Ready,
  OnboardingStep.WelcomeScreen1,
]);

export function isOnRecoveryKeyScreen(state: DeviceOnboardingState): boolean {
  return (
    state.isOnboarded &&
    state.recoveryKeyStatus !== null &&
    recoveryKeyScreenSteps.has(state.currentOnboardingStep)
  );
}

export type OnboardingEvent =
  | { type: "SESSION_READY" }
  | { type: "LOCKED" }
  | { type: "UNLOCKED"; output?: GetOsVersionResponse }
  | { type: "TRANSPORT_LOST" }
  | { type: "STEP_CHANGED"; state: DeviceOnboardingState }
  | { type: "DEVICE_STATE_READ"; state: DeviceOnboardingState; firmwareVersion: string }
  | {
      type: "DEVICE_STATE_UNREADABLE";
      isOnboarded: boolean;
      isInRecoveryMode: boolean;
      firmwareVersion: string;
    }
  | { type: "DEVICE_STATE_FAILED"; output: unknown }
  | { type: "DEVICE_IN_BOOTLOADER"; output: string }
  | { type: "DEVICE_IN_OSU"; output: string }
  | { type: "EARLY_CHECK_TOGGLED" }
  | { type: "EARLY_CHECK_UNAVAILABLE"; output: unknown }
  | { type: "ALLOW_SECURE_CONNECTION_REQUESTED" }
  | { type: "SECURE_CONNECTION_ALLOWED" }
  | { type: "GENUINE_CHECK_PASSED"; output: GenuineCheckDAOutput }
  | { type: "GENUINE_CHECK_REFUSED"; output: GenuineCheckFailure }
  | { type: "GENUINE_CHECK_FAILED"; output: GenuineCheckFailure }
  | { type: "DEVICE_NOT_GENUINE"; output: GenuineCheckDAOutput }
  | { type: "SECURE_CHANNEL_LOST"; output: GenuineCheckFailure }
  | { type: "FIRMWARE_UP_TO_DATE"; output: InstalledFirmware }
  | {
      type: "FIRMWARE_UPDATE_AVAILABLE";
      output: InstalledFirmware & { update: AvailableFirmwareUpdate };
    }
  | { type: "FIRMWARE_CHECK_FAILED"; output: unknown }
  | { type: "FIRMWARE_UPDATE_FLOW_CLOSED" }
  | { type: "RETRY" }
  | { type: "SKIP" }
  | { type: "CLOSE" }
  | { type: "QUIT" }
  | { type: "CONTINUE" }
  | { type: "USER_ACCEPT" }
  | { type: "USER_DECLINE" };

export type GenuineFailureEvent = Extract<
  OnboardingEvent,
  {
    type:
      | "GENUINE_CHECK_REFUSED"
      | "GENUINE_CHECK_FAILED"
      | "DEVICE_NOT_GENUINE"
      | "SECURE_CHANNEL_LOST";
  }
>;

export type GenuineFailureReport = {
  kind: GenuineFailureEvent["type"];
  failure: GenuineCheckFailure;
};

export type GenuineVerdict = {
  sessionId: DeviceSessionId;
  isGenuine: boolean;
};

export type DeviceOnboardingInput = {
  dmk: DeviceManagementKit;
  ports: DeviceOnboardingPorts;
  deviceId: string;
  deviceModelId: DeviceModelId;
  offerSync: boolean;
};

export type AvailableFirmwareUpdate = NonNullable<FirmwareUpdateContext["availableUpdate"]>;

export type InstalledFirmware = {
  os: string;
  mcu: string;
  bootloader: string;
};

export type DeviceOnboardingContext = DeviceOnboardingInput & {
  lastDeviceState: DeviceOnboardingState | null;
  firmwareVersion: string | null;
  hasStarted: boolean;
  isOnboarded: boolean;
  onboardedOnEntry: boolean | null;
  genuineVerdict: GenuineVerdict | null;
  secureConnectionRequested: boolean;
  lastGenuineFailure: GenuineFailureReport | null;
  onEarlyCheckScreen: boolean;
  firmwareChecked: boolean;
  checksPaused: boolean;
  availableFirmwareUpdate: AvailableFirmwareUpdate | null;
  currentSetupStep: OnboardingStep | null;
  recoveryKeyBackupOpen: boolean;
};

export type DeviceOnboardingExitReason =
  | "completed"
  | "offerLedgerSync"
  | "resumeFirmwareUpdate"
  | "legacyFallback"
  | "userQuit";

export type DeviceOnboardingOutput = {
  sessionId: DeviceSessionId;
  device: {
    id: string;
    modelId: DeviceModelId;
  };
  reason: DeviceOnboardingExitReason;
};
