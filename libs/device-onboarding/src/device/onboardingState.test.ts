import { createOsVersionResponse } from "../tests/osVersionResponse";
import { OnboardingStep } from "../types";
import { readOnboardingState, readOnboardingStep, readWordsInformation } from "./onboardingState";

describe("readOnboardingStep", () => {
  it.each(Object.values(OnboardingStep))("reads the %s step", step => {
    expect(readOnboardingStep(createOsVersionResponse({ onboardingState: step }))).toBe(step);
  });

  it("has no step when the catalogue does not decode it", () => {
    expect(readOnboardingStep(createOsVersionResponse())).toBeNull();
  });

  it.each(["unknown", "a-state-we-do-not-know"])("has no step for %s", onboardingState => {
    expect(readOnboardingStep(createOsVersionResponse({ onboardingState }))).toBeNull();
  });
});

describe("readWordsInformation", () => {
  it.each([12, 18, 24])("reads a %s words recovery phrase", numberOfWords => {
    expect(
      readWordsInformation(createOsVersionResponse({ numberOfWords, currentWordIndex: 3 })),
    ).toEqual({ seedWordIndex: 3, seedPhraseWordCount: numberOfWords });
  });

  it("reads the first word index", () => {
    expect(
      readWordsInformation(createOsVersionResponse({ numberOfWords: 24, currentWordIndex: 0 })),
    ).toEqual({ seedWordIndex: 0, seedPhraseWordCount: 24 });
  });

  it("has no seed progress when the catalogue does not decode it", () => {
    expect(readWordsInformation(createOsVersionResponse())).toBeNull();
  });

  it("has no seed progress without a word index", () => {
    expect(readWordsInformation(createOsVersionResponse({ numberOfWords: 24 }))).toBeNull();
  });

  it("has no seed progress for a recovery phrase length we do not support", () => {
    expect(
      readWordsInformation(createOsVersionResponse({ numberOfWords: 25, currentWordIndex: 0 })),
    ).toBeNull();
  });
});

describe("readOnboardingState", () => {
  it("reads a device waiting for the fourth word of a restore", () => {
    const response = createOsVersionResponse({
      isInRecoveryMode: true,
      isSecureConnectionAllowed: true,
      onboardingState: "restore-recovery-phrase",
      numberOfWords: 18,
      currentWordIndex: 3,
    });

    expect(readOnboardingState(response)).toEqual({
      isOnboarded: false,
      isInRecoveryMode: true,
      managerAllowed: true,
      currentOnboardingStep: OnboardingStep.RestoreSeed,
      seedWordIndex: 3,
      seedPhraseWordCount: 18,
    });
  });

  it("has no state on the catalogue version, which decodes neither field", () => {
    expect(readOnboardingState(createOsVersionResponse({ isOnboarded: true }))).toBeNull();
  });
});
