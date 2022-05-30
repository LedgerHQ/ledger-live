import { DeviceExtractOnboardingStateError } from "@ledgerhq/errors";
const onboardingFlagsBytesLength = 4;

const onboardedMask = 0x04;
const inRecoveryModeMask = 0x01;
const seedPhraseTypeMask = 0x60;
const seedPhraseTypeFlagOffset = 5;
const currentSeedWordIndexMask = 0x1f;

export enum SeedPhraseType {
  Twelve = "12-words",
  Eighteen = "18-words",
  TwentyFour = "24-words",
}

const fromBitsToSeedPhraseType = new Map<number, SeedPhraseType>([
  [0, SeedPhraseType.TwentyFour],
  [1, SeedPhraseType.Eighteen],
  [2, SeedPhraseType.Twelve],
]);

export enum OnboardingStep {
  WelcomeScreen = "WELCOME_SCREEN",
  SetupChoice = "SETUP_CHOICE",
  Pin = "PIN",
  NewDevice = "NEW_DEVICE", // path "new device" & currentSeedWordIndex available
  NewDeviceConfirming = "NEW_DEVICE_CONFIRMING", // path "new device" & currentSeedWordIndex available
  RestoreSeed = "RESTORE_SEED", // path "restore seed" & currentSeedWordIndex available
  SafetyWarning = "SAFETY WARNING",
  Ready = "READY",
}

const fromBitsToOnboardingStep = new Map<number, OnboardingStep>([
  [0, OnboardingStep.WelcomeScreen],
  [1, OnboardingStep.SetupChoice],
  [2, OnboardingStep.Pin],
  [3, OnboardingStep.NewDevice],
  [4, OnboardingStep.NewDeviceConfirming],
  [5, OnboardingStep.RestoreSeed],
  [6, OnboardingStep.SafetyWarning],
  [7, OnboardingStep.Ready],
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

export const extractOnboardingState = (flagsBytes: Buffer): OnboardingState => {
  if (!flagsBytes || flagsBytes.length < onboardingFlagsBytesLength) {
    throw new DeviceExtractOnboardingStateError(
      "Incorrect onboarding flags bytes"
    );
  }

  const isOnboarded = !!(flagsBytes[0] & onboardedMask);
  const isInRecoveryMode = !!(flagsBytes[0] & inRecoveryModeMask);

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
