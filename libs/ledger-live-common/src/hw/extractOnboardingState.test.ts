import {
  extractOnboardingState,
  OnboardingStep,
} from "./extractOnboardingState";

describe("@hw/extractOnboardingState", () => {
  describe("extractOnboardingState", () => {
    describe("When the flag bytes are incorrect", () => {
      it("should throw an error", () => {
        const incompleteFlagsBytes = Buffer.from([0, 0]);
        // DeviceExtractOnboardingStateError is not of type Error,
        // so cannot check in toThrow(DeviceExtractOnboardingStateError)
        expect(() => extractOnboardingState(incompleteFlagsBytes)).toThrow();
      });
    });

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

      describe("and the user is on the welcome screen", () => {
        beforeEach(() => {
          flagsBytes[3] = 0;
        });

        it("should return an onboarding step that is set at the welcome screen", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(
            OnboardingStep.welcomeScreen
          );
        });
      });

      describe("and the user is choosing what kind of setup they want", () => {
        beforeEach(() => {
          flagsBytes[3] = 1;
        });

        it("should return an onboarding step that is set at the setup choice", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(
            OnboardingStep.setupChoice
          );
        });
      });

      describe("and the user is setting their pin", () => {
        beforeEach(() => {
          flagsBytes[3] = 2;
        });

        it("should return an onboarding step that is set at setting the pin", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(
            OnboardingStep.pin
          );
        });
      });

      describe("and the user is generating a new seed", () => {
        describe("and the seed phrase type is set to 24 words", () => {
          beforeEach(() => {
            // 24-words seed
            flagsBytes[2] |= 0 << 5;
          });

          it("should return a device state with the correct seed phrase type", () => {
            const onboardingState = extractOnboardingState(flagsBytes);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.seedPhraseType).toBe("24-words");
          });

          describe("and the user is writing the seed word i", () => {
            beforeEach(() => {
              flagsBytes[3] = 3;
            });

            it("should return an onboarding step that is set at writting the seed phrase", () => {
              const onboardingState = extractOnboardingState(flagsBytes);

              expect(onboardingState).not.toBeNull();
              expect(onboardingState?.currentOnboardingStep).toBe(
                OnboardingStep.newDevice
              );
            });

            it("should return a device state with the index of the current seed word being written", () => {
              const byte3 = flagsBytes[2];
              for (let wordIndex = 0; wordIndex < 24; wordIndex++) {
                flagsBytes[2] = byte3 | wordIndex;

                const onboardingState = extractOnboardingState(flagsBytes);

                expect(onboardingState).not.toBeNull();
                expect(onboardingState?.currentSeedWordIndex).toBe(wordIndex);
              }
            });
          });

          describe("and the user is confirming the seed word i", () => {
            beforeEach(() => {
              flagsBytes[3] = 4;
            });

            it("should return an onboarding step that is set at confirming the seed phrase", () => {
              const onboardingState = extractOnboardingState(flagsBytes);

              expect(onboardingState).not.toBeNull();
              expect(onboardingState?.currentOnboardingStep).toBe(
                OnboardingStep.newDeviceConfirming
              );
            });

            it("should return a device state with the index of the current seed word being confirmed", () => {
              const byte3 = flagsBytes[2];
              for (let wordIndex = 0; wordIndex < 24; wordIndex++) {
                flagsBytes[2] = byte3 | wordIndex;

                const onboardingState = extractOnboardingState(flagsBytes);

                expect(onboardingState).not.toBeNull();
                expect(onboardingState?.currentSeedWordIndex).toBe(wordIndex);
              }
            });
          });
        });
      });

      describe("and the user is recovering a seed", () => {
        describe("and the seed phrase type is set to X words", () => {
          it("should return a device state with the correct seed phrase type", () => {
            const byte3 = flagsBytes[2];

            // 24-words
            flagsBytes[2] = byte3 | (0 << 5);
            let onboardingState = extractOnboardingState(flagsBytes);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.seedPhraseType).toBe("24-words");

            // 18-words
            flagsBytes[2] = byte3 | (1 << 5);
            onboardingState = extractOnboardingState(flagsBytes);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.seedPhraseType).toBe("18-words");

            // 12-words
            flagsBytes[2] = byte3 | (2 << 5);
            onboardingState = extractOnboardingState(flagsBytes);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.seedPhraseType).toBe("12-words");
          });

          describe("and the user is confirming (seed recovery) the seed word i", () => {
            beforeEach(() => {
              // 24-words seed
              flagsBytes[2] |= 0 << 5;

              flagsBytes[3] = 5;
            });

            it("should return an onboarding step that is set at confirming the restored seed phrase", () => {
              const onboardingState = extractOnboardingState(flagsBytes);

              expect(onboardingState).not.toBeNull();
              expect(onboardingState?.currentOnboardingStep).toBe(
                OnboardingStep.restoreSeed
              );
            });

            it("should return a device state with the index of the current seed word being confirmed", () => {
              const byte3 = flagsBytes[2];
              for (let wordIndex = 0; wordIndex < 24; wordIndex++) {
                flagsBytes[2] = byte3 | wordIndex;

                const onboardingState = extractOnboardingState(flagsBytes);

                expect(onboardingState).not.toBeNull();
                expect(onboardingState?.currentSeedWordIndex).toBe(wordIndex);
              }
            });
          });
        });
      });

      describe("and the user is on the safety warning screen", () => {
        beforeEach(() => {
          flagsBytes[3] = 6;
        });

        it("should return an onboarding step that is set at the safety warning screen", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(
            OnboardingStep.safetyWarning
          );
        });
      });

      describe("and the user finished the onboarding process", () => {
        beforeEach(() => {
          flagsBytes[3] = 7;
        });

        it("should return an onboarding step that is set at ready", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(
            OnboardingStep.ready
          );
        });
      });
    });
  });
});
