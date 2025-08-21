import { DeviceExtractOnboardingStateError } from "@ledgerhq/errors";
import { SeedPhraseType } from "@ledgerhq/types-live";

const CHARON_STEP_BIT_MASK = 0x1000;

const onboardingFlagsBytesLength = 4;

const onboardedMask = 0x04;
const inRecoveryModeMask = 0x01;
const seedPhraseTypeMask = 0x60;
const seedPhraseTypeFlagOffset = 5;
const currentSeedWordIndexMask = 0x1f;

const fromBitsToSeedPhraseType = new Map<number, SeedPhraseType>([
  [0, SeedPhraseType.TwentyFour],
  [1, SeedPhraseType.Eighteen],
  [2, SeedPhraseType.Twelve],
]);

export const fromSeedPhraseTypeToNbOfSeedWords = new Map<SeedPhraseType, number>([
  [SeedPhraseType.TwentyFour, 24],
  [SeedPhraseType.Eighteen, 18],
  [SeedPhraseType.Twelve, 12],
]);

export enum OnboardingStep {
  WelcomeScreen1 = "WELCOME_SCREEN_1",
  WelcomeScreen2 = "WELCOME_SCREEN_2",
  WelcomeScreen3 = "WELCOME_SCREEN_3",
  WelcomeScreen4 = "WELCOME_SCREEN_4",
  WelcomeScreenReminder = "WELCOME_SCREEN_REMINDER",
  OnboardingEarlyCheck = "ONBOARDING_EARLY_CHECK",
  ChooseName = "CHOOSE_NAME",
  Pin = "PIN",
  SetupChoice = "SETUP_CHOICE",
  NewDevice = "NEW_DEVICE", // path "new device" & currentSeedWordIndex available
  NewDeviceConfirming = "NEW_DEVICE_CONFIRMING", // path "new device" & currentSeedWordIndex available
  SetupChoiceRestore = "SETUP_CHOICE_RESTORE", // choosing between restoring a see directly (RestoreSeed) or use Recover (RecoverRestore)
  RestoreSeed = "RESTORE_SEED", // path "restore seed" & currentSeedWordIndex available
  RecoverRestore = "RECOVER_RESTORE", // path "restore with Recover"
  SafetyWarning = "SAFETY WARNING",
  Ready = "READY",
  BackupCharon = "BACKUP_CHARON",
  RestoreCharon = "RESTORE_CHARON",
}

const fromBitsToOnboardingStep = new Map<number, OnboardingStep>([
  [0x0, OnboardingStep.WelcomeScreen1],
  [0x1, OnboardingStep.WelcomeScreen2],
  [0x2, OnboardingStep.WelcomeScreen3],
  [0x3, OnboardingStep.WelcomeScreen4],
  [0x4, OnboardingStep.WelcomeScreenReminder],
  [0x5, OnboardingStep.SetupChoice],
  [0x6, OnboardingStep.Pin],
  [0x7, OnboardingStep.NewDevice],
  [0x8, OnboardingStep.NewDeviceConfirming],
  [0x9, OnboardingStep.RestoreSeed],
  [0xa, OnboardingStep.SafetyWarning],
  [0xb, OnboardingStep.Ready],
  [0xc, OnboardingStep.ChooseName],
  [0xd, OnboardingStep.RecoverRestore],
  [0xe, OnboardingStep.SetupChoiceRestore],
  [0xf, OnboardingStep.OnboardingEarlyCheck],
  [0x10, OnboardingStep.RestoreCharon],
  [CHARON_STEP_BIT_MASK + 0x0, OnboardingStep.Ready], // default state, after boot, if no backup was pending, this is also the state right after the device is seeded (if it was seeded with Charon)
  [CHARON_STEP_BIT_MASK + 0x1, OnboardingStep.Ready], // backup fully refused
  [CHARON_STEP_BIT_MASK + 0x2, OnboardingStep.BackupCharon], // backup not started or fully refused, this is the state right after the device is seeded (unless it was seeded with Charon)
  [CHARON_STEP_BIT_MASK + 0x3, OnboardingStep.BackupCharon], // backup process started but not finished
  [CHARON_STEP_BIT_MASK + 0x4, OnboardingStep.BackupCharon], // backup done on RK and naming not finished
  [CHARON_STEP_BIT_MASK + 0x5, OnboardingStep.Ready], // backup done on RK and backup-process exited
]);

export type OnboardingState = {
  // Device not yet onboarded otherwise
  isOnboarded: boolean;
  // In normal mode otherwise
  isInRecoveryMode: boolean;

  seedPhraseType: SeedPhraseType;

  currentOnboardingStep: OnboardingStep;
  currentSeedWordIndex: number;
  charonSupported: boolean;
  charonStatus: CharonStatus | null;
};

export enum CharonStatus {
  Rejected = 1,
  Choice,
  Running,
  Naming,
  Ready,
}

export const fromBitsToCharonStatusMap = new Map<number, CharonStatus>([
  [0x1, CharonStatus.Rejected],
  [0x2, CharonStatus.Choice],
  [0x3, CharonStatus.Running],
  [0x4, CharonStatus.Naming],
  [0x5, CharonStatus.Ready],
]);

/**
 * Extracts the onboarding state of the device
 * @param flagsBytes Buffer of bytes of length onboardingFlagsBytesLength representing the device state flags
 * @param charonStatusFlags Buffer of bytes of length charonStatusFlagsLength representing the charon status flags
 * @returns An OnboardingState
 */
export const extractOnboardingState = (
  flagsBytes: Buffer,
  charonState?: Buffer,
): OnboardingState => {
  if (!flagsBytes || flagsBytes.length < onboardingFlagsBytesLength) {
    throw new DeviceExtractOnboardingStateError("Incorrect onboarding flags bytes");
  }

  const isOnboarded = Boolean(flagsBytes[0] & onboardedMask);
  const isInRecoveryMode = Boolean(flagsBytes[0] & inRecoveryModeMask);

  const seedPhraseTypeBits = (flagsBytes[2] & seedPhraseTypeMask) >> seedPhraseTypeFlagOffset;
  const seedPhraseType = fromBitsToSeedPhraseType.get(seedPhraseTypeBits);

  if (!seedPhraseType) {
    throw new DeviceExtractOnboardingStateError(
      "Incorrect onboarding bits for the seed phrase type",
    );
  }

  const currentOnboardingStepBits = flagsBytes[3];
  let currentOnboardingStep = fromBitsToOnboardingStep.get(currentOnboardingStepBits);

  if (!currentOnboardingStep) {
    throw new DeviceExtractOnboardingStateError(
      "Incorrect onboarding bits for the current onboarding step",
    );
  }

  const currentSeedWordIndex = flagsBytes[2] & currentSeedWordIndexMask;

  const charonSupported = charonState !== undefined && charonState.length > 0;
  const charonOnboardingBits = charonSupported ? charonState[0] & 0xf : 0;
  //const charonUpdateBits = charonSupported ? (charonState[0] & 0x30) >> 4 : 0;
  const charonStatus =
    charonSupported && fromBitsToCharonStatusMap.has(charonOnboardingBits)
      ? fromBitsToCharonStatusMap.get(charonOnboardingBits)!
      : null;

  /*
   * Once the device is seeded, there are some additional states for backing up with Charon (for devices that support it)
   * There are 2 scenarios:
   *  - After the seeding of the device, the user goes through the safety warnings screens (step SafetyWarning), and then, compatible devices will display the backup screens.
   *    Then, the value of "currentOnboardingStep" is "Ready", and the additional information about the status of the backup is in the "charonState" buffer.
   *  - If the device is rebooted while the backup screens are displayed on the device, it will still display the backup screens when it is turned back on.
   *    Then, the value of "currentOnboardingStep" is "WelcomeScreen1", and the additional information about the status of the backup is in the "charonState" buffer.
   */
  if (
    isOnboarded &&
    [OnboardingStep.Ready, OnboardingStep.WelcomeScreen1].includes(currentOnboardingStep) &&
    charonSupported
  ) {
    currentOnboardingStep = fromBitsToOnboardingStep.get(
      charonOnboardingBits + CHARON_STEP_BIT_MASK,
    );

    if (!currentOnboardingStep) {
      throw new DeviceExtractOnboardingStateError(
        "Incorrect onboarding bits for the current charon step",
      );
    }
  }

  return {
    isOnboarded,
    isInRecoveryMode,
    seedPhraseType,
    currentOnboardingStep,
    currentSeedWordIndex,
    charonSupported,
    charonStatus,
  };
};
