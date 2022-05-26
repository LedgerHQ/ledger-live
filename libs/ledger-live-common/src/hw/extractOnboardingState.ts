import { DeviceExtractOnboardingStateError } from "@ledgerhq/errors";
const onboardingFlagsBytesLength = 4;

const onboardedMask = 0x04;
const inRecoveryModeMask = 0x01;
const seedPhraseTypeMask = 0x60;
const seedPhraseTypeFlagOffset = 5;
const currentSeedWordIndexMask = 0x1f;

export type SeedPhraseType = "24-words" | "18-words" | "12-words";
const fromBitsToSeedPhraseType = new Map<number, SeedPhraseType>([
  [0, "24-words"],
  [1, "18-words"],
  [2, "12-words"],
]);

export enum OnboardingStep {
  welcomeScreen = "WELCOME_SCREEN",
  setupChoice = "SETUP_CHOICE",
  pin = "PIN",
  newDevice = "NEW_DEVICE", // path "new device" & currentSeedWordIndex available
  newDeviceConfirming = "NEW_DEVICE_CONFIRMING", // path "new device" & currentSeedWordIndex available
  restoreSeed = "RESTORE_SEED", // path "restore seed" & currentSeedWordIndex available
  safetyWarning = "SAFETY WARNING",
  ready = "READY",
}

const fromBitsToOnboardingStep = new Map<number, OnboardingStep>([
  [0, OnboardingStep.welcomeScreen],
  [1, OnboardingStep.setupChoice],
  [2, OnboardingStep.pin],
  [3, OnboardingStep.newDevice],
  [4, OnboardingStep.newDeviceConfirming],
  [5, OnboardingStep.restoreSeed],
  [6, OnboardingStep.safetyWarning],
  [7, OnboardingStep.ready],
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
