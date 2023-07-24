import { from, of, throwError } from "rxjs";
import { StatusCodes, TransportStatusError } from "@ledgerhq/errors";
import { toggleOnboardingEarlyCheckTask } from "./toggleOnboardingEarlyCheck";
import { toggleOnboardingEarlyCheckCmd } from "../commands/toggleOnboardingEarlyCheck";
import { withTransport } from "../transports/core";
import { aTransportRefBuilder } from "../mocks/aTransportRef";

jest.useFakeTimers();

jest.mock("../commands/toggleOnboardingEarlyCheck");
const mockedToggleOnboardingEarlyCheckCmd = jest.mocked(toggleOnboardingEarlyCheckCmd);

jest.mock("../transports/core");
const mockedWithTransport = jest.mocked(withTransport);

describe("@deviceSDK/tasks/toggleOnboardingEarlyCheckTask", () => {
  beforeAll(async () => {
    const transportRef = await aTransportRefBuilder();
    mockedWithTransport.mockReturnValue(job => from(job({ transportRef })));
  });

  describe("When the device is in the expected onboarding state", () => {
    it("should emit a success event after being able to enter or exit the onboarding early checks step successfully", done => {
      mockedToggleOnboardingEarlyCheckCmd.mockReturnValue(of({ type: "success" }));

      // `enter` and `exit` have the same behavior
      toggleOnboardingEarlyCheckTask({
        deviceId: "",
        toggleType: "exit",
      }).subscribe({
        next: event => {
          expect(event.type).toBe("success");
          done();
        },
        error: (error: unknown) => {
          done(`No error should have been thrown: ${JSON.stringify(error)}`);
        },
      });
    });
  });

  describe("When the device is neither in the WELCOME and WELCOME_STEP2 onboarding state, and it returns 0x6982", () => {
    it("should emit a task error event with the correct error type", done => {
      mockedToggleOnboardingEarlyCheckCmd.mockReturnValue(
        throwError(new TransportStatusError(StatusCodes.SECURITY_STATUS_NOT_SATISFIED)),
      );

      toggleOnboardingEarlyCheckTask({
        deviceId: "",
        toggleType: "enter",
      }).subscribe({
        next: event => {
          try {
            if (event.type === "taskError") {
              expect(event.error).toBe("DeviceInInvalidState");
              done();
            } else {
              done(`The event is incorrect: ${JSON.stringify(event)}`);
            }
          } catch (expectError) {
            done(expectError);
          }
        },
        error: (error: unknown) => {
          done(
            `The error should have been mapped to an event, not thrown: ${JSON.stringify(error)}`,
          );
        },
      });
    });
  });

  describe("When the command is not respected the expected APDU format", () => {
    it("should emit a task error event with the correct error type", done => {
      mockedToggleOnboardingEarlyCheckCmd.mockReturnValue(
        throwError(new TransportStatusError(StatusCodes.INCORRECT_LENGTH)),
      );

      toggleOnboardingEarlyCheckTask({
        deviceId: "",
        toggleType: "enter",
      }).subscribe({
        next: event => {
          try {
            if (event.type === "taskError") {
              expect(event.error).toBe("InternalError");
              done();
            } else {
              done(`The event is incorrect: ${JSON.stringify(event)}`);
            }
          } catch (expectError) {
            done(expectError);
          }
        },
        error: (error: unknown) => {
          done(
            `The error should have been mapped to an event, not thrown: ${JSON.stringify(error)}`,
          );
        },
      });
    });
  });
});
