import { DeviceExtractOnboardingStateError } from "@ledgerhq/errors";
import { SeedPhraseType } from "@ledgerhq/types-live";

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

export const fromSeedPhraseTypeToNbOfSeedWords = new Map<
  SeedPhraseType,
  number
>([
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
  SetupChoice = "SETUP_CHOICE",
  Pin = "PIN",
  NewDevice = "NEW_DEVICE", // path "new device" & currentSeedWordIndex available
  NewDeviceConfirming = "NEW_DEVICE_CONFIRMING", // path "new device" & currentSeedWordIndex available
  RestoreSeed = "RESTORE_SEED", // path "restore seed" & currentSeedWordIndex available
  SafetyWarning = "SAFETY WARNING",
  Ready = "READY",
  ChooseName = "CHOOSE_NAME",
}

const fromBitsToOnboardingStep = new Map<number, OnboardingStep>([
  [0, OnboardingStep.WelcomeScreen1],
  [1, OnboardingStep.WelcomeScreen2],
  [2, OnboardingStep.WelcomeScreen3],
  [3, OnboardingStep.WelcomeScreen4],
  [4, OnboardingStep.WelcomeScreenReminder],
  [5, OnboardingStep.SetupChoice],
  [6, OnboardingStep.Pin],
  [7, OnboardingStep.NewDevice],
  [8, OnboardingStep.NewDeviceConfirming],
  [9, OnboardingStep.RestoreSeed],
  [10, OnboardingStep.SafetyWarning],
  [11, OnboardingStep.Ready],
  [12, OnboardingStep.ChooseName],
]);

export type OnboardingState = {
  // Device not yet onboarded otherwise
  isOnboarded: boolean;
  // In normal mode otherwise
  isInRecoveryMode: boolean;

  seedPhraseType: SeedPhraseType;

  currentOnboardingStep: OnboardingStep;
  currentSeedWordIndex: number;
};

/**
 * Extracts the onboarding state of the device
 * @param flagsBytes Buffer of bytes of length onboardingFlagsBytesLength reprensenting the device state flags
 * @returns An OnboardingState
 */
export const extractOnboardingState = (flagsBytes: Buffer): OnboardingState => {
  if (!flagsBytes || flagsBytes.length < onboardingFlagsBytesLength) {
    throw new DeviceExtractOnboardingStateError(
      "Incorrect onboarding flags bytes"
    );
  }

  const isOnboarded = Boolean(flagsBytes[0] & onboardedMask);
  const isInRecoveryMode = Boolean(flagsBytes[0] & inRecoveryModeMask);

  const seedPhraseTypeBits =
    (flagsBytes[2] & seedPhraseTypeMask) >> seedPhraseTypeFlagOffset;
  const seedPhraseType = fromBitsToSeedPhraseType.get(seedPhraseTypeBits);

  if (!seedPhraseType) {
    throw new DeviceExtractOnboardingStateError(
      "Incorrect onboarding bits for the seed phrase type"
    );
  }

  const currentOnboardingStepBits = flagsBytes[3];
  const currentOnboardingStep = fromBitsToOnboardingStep.get(
    currentOnboardingStepBits
  );

  if (!currentOnboardingStep) {
    throw new DeviceExtractOnboardingStateError(
      "Incorrect onboarding bits for the current onboarding step"
    );
  }

  const currentSeedWordIndex = flagsBytes[2] & currentSeedWordIndexMask;

  return {
    isOnboarded,
    isInRecoveryMode,
    seedPhraseType,
    currentOnboardingStep,
    currentSeedWordIndex,
  };
};
