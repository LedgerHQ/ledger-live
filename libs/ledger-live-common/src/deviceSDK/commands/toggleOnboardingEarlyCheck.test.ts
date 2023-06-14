import { MockTransport } from "@ledgerhq/hw-transport-mocker";
import { ToggleTypeP2, toggleOnboardingEarlyCheckCmd } from "./toggleOnboardingEarlyCheck";
import { StatusCodes, TransportStatusError } from "@ledgerhq/errors";

describe("@deviceSDK/commands/toggleOnboardingEarlyCheckCmd", () => {
  describe("When the device is neither in the WELCOME and WELCOME_STEP2 onboarding state, and it returns 0x6982", () => {
    it("should throw an error", done => {
      const transport = new MockTransport(Buffer.from([0x69, 0x82]));

      toggleOnboardingEarlyCheckCmd({
        transport,
        p2: ToggleTypeP2.EnterChecking,
      }).subscribe({
        next: _ => {
          done("An error should have been thrown");
        },
        error: (error: unknown) => {
          try {
            if (error instanceof TransportStatusError) {
              // @ts-expect-error TransportStatusError not typed correctly
              expect(error.statusCode).toBe(StatusCodes.SECURITY_STATUS_NOT_SATISFIED);
              done();
            } else {
              done("An incorrect error has been received");
            }
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });
  });

  describe("When the sent APDU is not respected the expected format, and it returns 0x6700", () => {
    it("should throw an error", done => {
      const transport = new MockTransport(Buffer.from([0x67, 0x00]));

      toggleOnboardingEarlyCheckCmd({
        transport,
        p2: ToggleTypeP2.EnterChecking,
      }).subscribe({
        next: _ => {
          done("An error should have been thrown");
        },
        error: (error: unknown) => {
          try {
            if (error instanceof TransportStatusError) {
              // @ts-expect-error TransportStatusError not typed correctly
              expect(error.statusCode).toBe(StatusCodes.INCORRECT_LENGTH);
              done();
            } else {
              done("An incorrect error has been received");
            }
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });
  });

  describe("When the device is in the expected onboarding state", () => {
    it("should be able to enter or exit the onboarding early checks step successfully", done => {
      const transport = new MockTransport(Buffer.from([0x90, 0x00]));

      // enter and exit have the same behavior
      toggleOnboardingEarlyCheckCmd({
        transport,
        p2: ToggleTypeP2.EnterChecking,
      }).subscribe({
        next: _ => {
          done();
        },
        error: (error: unknown) => {
          done(`No error should have been thrown: ${error}`);
        },
      });
    });
  });
});
