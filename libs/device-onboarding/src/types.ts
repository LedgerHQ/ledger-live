import type {
  DeviceManagementKit,
  DeviceModelId,
  DeviceSessionId,
  FirmwareUpdateContext,
} from "@ledgerhq/device-management-kit";

export const OnboardingStep = {
  WelcomeScreen1: "WELCOME_SCREEN_1",
  WelcomeScreen2: "WELCOME_SCREEN_2",
  WelcomeScreen3: "WELCOME_SCREEN_3",
  WelcomeScreen4: "WELCOME_SCREEN_4",
  WelcomeScreenReminder: "WELCOME_SCREEN_REMINDER",
  OnboardingEarlyCheck: "ONBOARDING_EARLY_CHECK",
  ChooseName: "CHOOSE_NAME",
  Pin: "PIN",
  SetupChoice: "SETUP_CHOICE",
  SetupChoiceRestore: "SETUP_CHOICE_RESTORE",
  NewDevice: "NEW_DEVICE",
  NewDeviceConfirming: "NEW_DEVICE_CONFIRMING",
  RestoreSeed: "RESTORE_SEED",
  RecoverRestore: "RECOVER_RESTORE",
  RestoreCharon: "RESTORE_CHARON",
  SafetyWarning: "SAFETY_WARNING",
  Ready: "READY",
} as const;

export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

export type SeedPhraseWordCount = 12 | 18 | 24;

export type DeviceOnboardingState = {
  isOnboarded: boolean;
  isInRecoveryMode: boolean;
  managerAllowed: boolean;
  currentOnboardingStep: OnboardingStep;
  seedWordIndex: number;
  seedPhraseWordCount: SeedPhraseWordCount;
};

export type OnboardingEvent =
  | { type: "SESSION_READY" }
  | { type: "LOCKED" }
  | { type: "UNLOCKED" }
  | { type: "TRANSPORT_LOST" }
  | { type: "STEP_CHANGED"; state: DeviceOnboardingState }
  | { type: "START" }
  | { type: "RETRY" }
  | { type: "SKIP" }
  | { type: "CLOSE" }
  | { type: "QUIT" }
  | { type: "USER_ACCEPT" }
  | { type: "USER_DECLINE" };

export type DeviceOnboardingInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  deviceModelId: DeviceModelId;
  offerSync: boolean;
};

export type AvailableFirmwareUpdate = NonNullable<FirmwareUpdateContext["availableUpdate"]>;

export type DeviceOnboardingContext = DeviceOnboardingInput & {
  lastDeviceState: DeviceOnboardingState | null;
  genuineChecked: boolean;
  escEntered: boolean;
  forcedVersion: boolean;
  availableFirmwareUpdate: AvailableFirmwareUpdate | null;
  currentSetupStep: OnboardingStep | null;
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
