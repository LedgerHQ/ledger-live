import { DeviceExtractOnboardingStateError } from "@ledgerhq/errors";
import { CharonStatus, extractOnboardingState, OnboardingStep } from "./extractOnboardingState";

describe("@hw/extractOnboardingState", () => {
  describe("extractOnboardingState", () => {
    describe("When the flag bytes are incorrect", () => {
      it("should throw an error", () => {
        const incompleteFlagsBytes = Buffer.from([0, 0]);

        expect(() => extractOnboardingState(incompleteFlagsBytes)).toThrow(
          DeviceExtractOnboardingStateError,
        );
      });
    });

    describe("When the device is onboarded", () => {
      it("should return a device state that is onboarded", () => {
        const flagsBytes = Buffer.from([1 << 2, 0, 0, 0]);

        const onboardingState = extractOnboardingState(flagsBytes);

        expect(onboardingState).not.toBeNull();
        expect(onboardingState?.isOnboarded).toBe(true);
      });

      describe("and the user is on the charon backup screen", () => {
        const flagsBytes = Buffer.from([1 << 2, 0, 0, 0xb]);

        describe("and the device was seeded with charon", () => {
          it("should return an onboarding step that is set at the charon screen", () => {
            const charonState = Buffer.from([0x0]);
            const onboardingState = extractOnboardingState(flagsBytes, charonState);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.Ready);
            expect(onboardingState?.charonStatus).toBeNull();
          });

          it("should ignore charon update status", () => {
            const charonState = Buffer.from([0x20]);
            const onboardingState = extractOnboardingState(flagsBytes, charonState);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.Ready);
            expect(onboardingState?.charonStatus).toBeNull();
          });
        });

        describe("and the user refuse to backup the charon", () => {
          it("should return an onboarding step that is set at ready", () => {
            const charonState = Buffer.from([0x1]);
            const onboardingState = extractOnboardingState(flagsBytes, charonState);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.Ready);
            expect(onboardingState?.charonStatus).toBe(CharonStatus.Rejected);
          });

          describe("and charon backup process started but not finished", () => {
            it("should return an onboarding step that is set at the charon screen", () => {
              const charonState = Buffer.from([0x3]);
              const onboardingState = extractOnboardingState(flagsBytes, charonState);

              expect(onboardingState).not.toBeNull();
              expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.BackupCharon);
              expect(onboardingState?.charonStatus).toBe(CharonStatus.Running);
            });

            describe("and the charon backup is done and naming not finished", () => {
              it("should return an onboarding step that is set at the charon screen", () => {
                const charonState = Buffer.from([0x4]);
                const onboardingState = extractOnboardingState(flagsBytes, charonState);

                expect(onboardingState).not.toBeNull();
                expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.BackupCharon);
                expect(onboardingState?.charonStatus).toBe(CharonStatus.Naming);
              });

              describe("and the charon backup is done and backup-process exited", () => {
                it("should return an onboarding step that is set at ready", () => {
                  const charonState = Buffer.from([0x5]);
                  const onboardingState = extractOnboardingState(flagsBytes, charonState);

                  expect(onboardingState).not.toBeNull();
                  expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.Ready);
                  expect(onboardingState?.charonStatus).toBe(CharonStatus.Ready);
                });
              });
            });
          });
        });

        describe("and charon backup is not started and not fully refused", () => {
          it("should return an onboarding step that is set at ready", () => {
            const charonState = Buffer.from([0x2]);
            const onboardingState = extractOnboardingState(flagsBytes, charonState);

            expect(onboardingState).not.toBeNull();
            expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.BackupCharon);
            expect(onboardingState?.charonStatus).toBe(CharonStatus.Choice);
          });
        });
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
        it("should return an onboarding step that is set at the welcome screen", () => {
          flagsBytes[3] = 0;
          let onboardingState = extractOnboardingState(flagsBytes);
          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.WelcomeScreen1);

          flagsBytes[3] = 1;
          onboardingState = extractOnboardingState(flagsBytes);
          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.WelcomeScreen2);

          flagsBytes[3] = 2;
          onboardingState = extractOnboardingState(flagsBytes);
          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.WelcomeScreen3);

          flagsBytes[3] = 3;
          onboardingState = extractOnboardingState(flagsBytes);
          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.WelcomeScreen4);
        });
      });

      describe("and the user is on the onboarding early check screen", () => {
        beforeEach(() => {
          flagsBytes[3] = 15;
        });

        it("should return an onboarding step that is set at the onboarding early check screen", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.OnboardingEarlyCheck);
        });
      });

      describe("and the user is on 'choose name' step", () => {
        beforeEach(() => {
          flagsBytes[3] = 12;
        });

        it("should return an onboarding step that is set at ready", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.ChooseName);
        });
      });

      describe("and the user is setting their pin", () => {
        beforeEach(() => {
          flagsBytes[3] = 6;
        });

        it("should return an onboarding step that is set at setting the pin", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.Pin);
        });
      });

      describe("and the user is choosing what kind of setup they want", () => {
        beforeEach(() => {
          flagsBytes[3] = 5;
        });

        it("should return an onboarding step that is set at the setup choice", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.SetupChoice);
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
              flagsBytes[3] = 7;
            });

            it("should return an onboarding step that is set at writting the seed phrase", () => {
              const onboardingState = extractOnboardingState(flagsBytes);

              expect(onboardingState).not.toBeNull();
              expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.NewDevice);
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
              flagsBytes[3] = 8;
            });

            it("should return an onboarding step that is set at confirming the seed phrase", () => {
              const onboardingState = extractOnboardingState(flagsBytes);

              expect(onboardingState).not.toBeNull();
              expect(onboardingState?.currentOnboardingStep).toBe(
                OnboardingStep.NewDeviceConfirming,
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

      describe("and the user wants to restore a seed, choosing between restoring their own seed or Recover", () => {
        beforeEach(() => {
          flagsBytes[3] = 14;
        });

        it("should return an onboarding step that is set at the setup restore choice", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.SetupChoiceRestore);
        });
      });

      describe("and the user is restoring a seed directly (without Recover)", () => {
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

              flagsBytes[3] = 9;
            });

            it("should return an onboarding step that is set at confirming the restored seed phrase", () => {
              const onboardingState = extractOnboardingState(flagsBytes);

              expect(onboardingState).not.toBeNull();
              expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.RestoreSeed);
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

      describe("and the user wants to restore with Recover", () => {
        beforeEach(() => {
          flagsBytes[3] = 13;
        });

        it("should return an onboarding step that is set at the restore with Recover", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.RecoverRestore);
        });
      });

      describe("and the user is on the safety warning screen", () => {
        beforeEach(() => {
          flagsBytes[3] = 10;
        });

        it("should return an onboarding step that is set at the safety warning screen", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.SafetyWarning);
        });
      });

      describe("and the user finished the onboarding process with a device that does not support charon", () => {
        beforeEach(() => {
          flagsBytes[3] = 11;
          flagsBytes[4] = 0; // recover
          flagsBytes[5] = undefined as unknown as number; // charon not supported
        });

        it("should return an onboarding step that is set at ready", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.Ready);
        });
      });

      describe("and the user finished the onboarding process with a device that does not support recover and charon", () => {
        beforeEach(() => {
          flagsBytes[3] = 11;
          flagsBytes[4] = undefined as unknown as number; // recover not supported
          flagsBytes[5] = undefined as unknown as number; // charon not supported
        });

        it("should return an onboarding step that is set at ready", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.Ready);
        });
      });

      describe("and the device is set to an onboarding step/flag that is not handled yet", () => {
        beforeEach(() => {
          // To update so it's never handled
          flagsBytes[3] = 20;
        });

        it("should thrown an error", () => {
          // DeviceExtractOnboardingStateError is not of type Error,
          // so cannot check in toThrow(DeviceExtractOnboardingStateError)
          expect(() => extractOnboardingState(flagsBytes)).toThrow(
            DeviceExtractOnboardingStateError,
          );
        });
      });

      describe("and the user is on the restore charon screen", () => {
        beforeEach(() => {
          flagsBytes = Buffer.from([0, 0, 0, 0x10]);
        });

        it("should return an onboarding step that is set at the restore from charon screen", () => {
          const onboardingState = extractOnboardingState(flagsBytes);

          expect(onboardingState).not.toBeNull();
          expect(onboardingState?.currentOnboardingStep).toBe(OnboardingStep.RestoreCharon);
        });
      });
    });

    describe("When charon flags are provided", () => {
      it("should return charonSupported=true", () => {
        const onboardingState = extractOnboardingState(
          Buffer.from([0, 0, 0, 0]),
          Buffer.from([0x0]),
        );

        expect(onboardingState).not.toBeNull();
        expect(onboardingState?.charonSupported).toBe(true);
      });
    });
    describe("When charon flags are not provided", () => {
      it("should return charonSupported=false", () => {
        const onboardingState = extractOnboardingState(Buffer.from([0, 0, 0, 0]));

        expect(onboardingState).not.toBeNull();
        expect(onboardingState?.charonSupported).toBe(false);
      });
    });
  });
});
