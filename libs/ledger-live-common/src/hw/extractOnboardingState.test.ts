import { extractOnboardingState } from "./extractOnboardingState";

describe("@hw/extractOnboardingState", () => {
  describe("extractOnboardingState", () => {
    describe("When the device is onboarded", () => {
      it("should return a device state that is onboarded", () => {
        const flagsBytes = Buffer.from([1 << 2, 0, 0, 0]);

        const onboardingState = extractOnboardingState(flagsBytes);

        expect(onboardingState).not.toBeNull();
        expect(onboardingState?.isOnboarded).toBe(true);
      });
    });

    describe("When the device is in recovery mode", () => {
      it("should return a device state that is in recovery mode", () => {
        const flagsBytes = Buffer.from([1, 0, 0, 0]);

        const onboardingState = extractOnboardingState(flagsBytes);

        expect(onboardingState).not.toBeNull();
        expect(onboardingState?.isInRecoveryMode).toBe(true);
      });
    });

    describe("When the device is not onboarded and in normal mode", () => {
      let flagsBytes: Buffer;

      beforeEach(() => {
        flagsBytes = Buffer.from([0, 0, 0, 0]);
      });

      describe("and the user is recovering a seed", () => {
        beforeEach(() => {
          flagsBytes[2] = 1 << 7;
        });

        it("should return a device state that is recovering a seed", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.isRecoveringSeed).toBe(true);
        });

        describe("and the seed phrase type is set to X words", () => {
          it("should return a device state with the correct seed phrase type", () => {
            const byte3 = flagsBytes[2];

            // 24-words
            flagsBytes[2] = byte3 | (0 << 5);
            let onboardingState = extractOnboardingState(flagsBytes);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.isRecoveringSeed).toBe(true);
            expect(onboardingState?.seedPhraseType).toBe("24-words");

            // 18-words
            flagsBytes[2] = byte3 | (1 << 5);
            onboardingState = extractOnboardingState(flagsBytes);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.isRecoveringSeed).toBe(true);
            expect(onboardingState?.seedPhraseType).toBe("18-words");

            // 12-words
            flagsBytes[2] = byte3 | (2 << 5);
            onboardingState = extractOnboardingState(flagsBytes);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.isRecoveringSeed).toBe(true);
            expect(onboardingState?.seedPhraseType).toBe("12-words");
          });

          describe("and the user is confirming (seed recovery) the seed word i", () => {
            beforeEach(() => {
              // 24-words seed
              flagsBytes[2] |= 0 << 5;
              // Confirming words
              flagsBytes[3] |= 1;
            });

            it("should return a device state with the index of the current seed word being confirmed", () => {
              const byte3 = flagsBytes[2];
              for (let wordIndex = 0; wordIndex < 24; wordIndex++) {
                flagsBytes[2] = byte3 | wordIndex;

                const onboardingState = extractOnboardingState(flagsBytes);
                expect(onboardingState?.isRecoveringSeed).toBe(true);
                expect(onboardingState?.seedPhraseType).toBe("24-words");
                expect(onboardingState?.isConfirmingSeedWords).toBe(true);
                expect(onboardingState?.currentSeedWordIndex).toBe(wordIndex);
              }
            });
          });
        });
      });

      describe("and the user is generating a new seed", () => {
        beforeEach(() => {
          flagsBytes[2] = 0 << 7;
        });

        it("should return a device state that is generating a new seed", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.isRecoveringSeed).toBe(false);
        });

        describe("and the seed phrase type is set to 24 words", () => {
          beforeEach(() => {
            // 24-words seed
            flagsBytes[2] |= 0 << 5;
          });

          it("should return a device state with the correct seed phrase type", () => {
            const onboardingState = extractOnboardingState(flagsBytes);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.isRecoveringSeed).toBe(false);
            expect(onboardingState?.seedPhraseType).toBe("24-words");
          });

          describe("and the user is writing the seed word i", () => {
            beforeEach(() => {
              // Writing words
              flagsBytes[3] |= 0;
            });

            it("should return a device state with the index of the current seed word being written", () => {
              const byte3 = flagsBytes[2];
              for (let wordIndex = 0; wordIndex < 24; wordIndex++) {
                flagsBytes[2] = byte3 | wordIndex;

                const onboardingState = extractOnboardingState(flagsBytes);
                expect(onboardingState?.isRecoveringSeed).toBe(false);
                expect(onboardingState?.seedPhraseType).toBe("24-words");
                expect(onboardingState?.isConfirmingSeedWords).toBe(false);
                expect(onboardingState?.currentSeedWordIndex).toBe(wordIndex);
              }
            });
          });

          describe("and the user is confirming the seed word i", () => {
            beforeEach(() => {
              // Confirming words
              flagsBytes[3] |= 1;
            });

            it("should return a device state with the index of the current seed word being confirmed", () => {
              const byte3 = flagsBytes[2];
              for (let wordIndex = 0; wordIndex < 24; wordIndex++) {
                flagsBytes[2] = byte3 | wordIndex;

                const onboardingState = extractOnboardingState(flagsBytes);
                expect(onboardingState?.isRecoveringSeed).toBe(false);
                expect(onboardingState?.seedPhraseType).toBe("24-words");
                expect(onboardingState?.isConfirmingSeedWords).toBe(true);
                expect(onboardingState?.currentSeedWordIndex).toBe(wordIndex);
              }
            });
          });
        });
      });
    });
  });
});
