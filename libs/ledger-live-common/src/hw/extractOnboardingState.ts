const onboardingFlagsBytesLength = 4;

const onboardedMask = 0x04;
const inRecoveryModeMask = 0x01;
const recoveringSeedPathMask = 0x80;
const seedPhraseTypeMask = 0x60;
const seedPhraseTypeFlagOffset = 5;
const currentSeedWordIndexMask = 0x1f;
const confirmingSeedWordsMask = 0x01;

export type SeedPhraseType = "24-words" | "18-words" | "12-words";
const fromFlagToSeedPhraseType = new Map<number, SeedPhraseType>([
  [0, "24-words"],
  [1, "18-words"],
  [2, "12-words"],
]);

export type OnboardingState = {
  // Device not yet onboarded otherwise
  isOnboarded: boolean;
  // In normal mode otherwise
  isInRecoveryMode: boolean;
  // Generating a new seed otherwise
  isRecoveringSeed: boolean;
  // Writing seed words otherwise
  isConfirmingSeedWords: boolean;
  seedPhraseType: SeedPhraseType;
  currentSeedWordIndex: number;
};

export const extractOnboardingState = (
  flagsBytes: Buffer
): OnboardingState | null => {
  if (!flagsBytes || flagsBytes.length < onboardingFlagsBytesLength) {
    return null;
  }

  const isOnboarded = !!(flagsBytes[0] & onboardedMask);
  const isInRecoveryMode = !!(flagsBytes[0] & inRecoveryModeMask);
  const isRecoveringSeed = !!(flagsBytes[2] & recoveringSeedPathMask);
  const isConfirmingSeedWords = !!(flagsBytes[3] & confirmingSeedWordsMask);

  const seedPhraseTypeFlag =
    (flagsBytes[2] & seedPhraseTypeMask) >> seedPhraseTypeFlagOffset;
  const seedPhraseType = fromFlagToSeedPhraseType.get(seedPhraseTypeFlag);

  if (!seedPhraseType) {
    // FIXME: what do we do in case of flags errors ? It could happen after an update
    // on the flags and no update on live-common for ex
    return null;
  }

  const currentSeedWordIndex = flagsBytes[2] & currentSeedWordIndexMask;

  return {
    isOnboarded,
    isInRecoveryMode,
    isRecoveringSeed,
    isConfirmingSeedWords,
    seedPhraseType,
    currentSeedWordIndex,
  };
};
