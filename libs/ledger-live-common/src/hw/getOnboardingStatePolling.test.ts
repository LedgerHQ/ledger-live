import { getOnboardingStatePolling } from "./getOnboardingStatePolling";
import { from, Subscription, TimeoutError } from "rxjs";
import * as rxjsOperators from "rxjs/operators";
import { DeviceModelId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";
import {
  DeviceExtractOnboardingStateError,
  DisconnectedDevice,
} from "@ledgerhq/errors";
import { withDevice } from "./deviceAccess";
import getVersion from "./getVersion";
import {
  extractOnboardingState,
  OnboardingState,
  OnboardingStep,
} from "./extractOnboardingState";
import { SeedPhraseType } from "../types/manager";

jest.mock("./deviceAccess");
jest.mock("./getVersion");
jest.mock("./extractOnboardingState");
jest.mock("@ledgerhq/hw-transport");
jest.useFakeTimers();

const aDevice = {
  deviceId: "DEVICE_ID_A",
  deviceName: "DEVICE_NAME_A",
  modelId: DeviceModelId.nanoFTS,
  wired: false,
};

// As extractOnboardingState is mocked, the firmwareInfo
// returned by getVersion does not matter
const aFirmwareInfo = {
  isBootloader: false,
  rawVersion: "",
  targetId: 0,
  mcuVersion: "",
  flags: Buffer.from([]),
};

const pollingPeriodMs = 1000;

const mockedGetVersion = jest.mocked(getVersion);
// const mockedWithDevice = withDevice as jest.Mock;
const mockedWithDevice = jest.mocked(withDevice);
mockedWithDevice.mockReturnValue((job) => from(job(new Transport())));

const mockedExtractOnboardingState = jest.mocked(extractOnboardingState);

describe("getOnboardingStatePolling", () => {
  let anOnboardingState: OnboardingState;
  let onboardingStatePollingSubscription: Subscription | null;

  beforeEach(() => {
    anOnboardingState = {
      isOnboarded: false,
      isInRecoveryMode: false,
      seedPhraseType: SeedPhraseType.TwentyFour,
      currentSeedWordIndex: 0,
      currentOnboardingStep: OnboardingStep.NewDevice,
    };
  });

  afterEach(() => {
    mockedGetVersion.mockClear();
    mockedExtractOnboardingState.mockClear();
    jest.clearAllTimers();
    onboardingStatePollingSubscription?.unsubscribe();
  });

  describe("When a communication error occurs while fetching the device state", () => {
    describe("and when the error is allowed and thrown before the defined timeout", () => {
      it("should update the onboarding state to null and keep track of the allowed error", (done) => {
        mockedGetVersion.mockRejectedValue(
          new DisconnectedDevice("An allowed error")
        );
        mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

        const device = aDevice;

        getOnboardingStatePolling({
          deviceId: device.deviceId,
          pollingPeriodMs,
        }).subscribe({
          next: (value) => {
            expect(value.onboardingState).toBeNull();
            expect(value.allowedError).toBeInstanceOf(DisconnectedDevice);
            done();
          },
        });

        jest.runOnlyPendingTimers();
      });
    });

    describe("and when a timeout occurred before the error (or the fetch took too long)", () => {
      it("should update the allowed error value to notify the consumer", (done) => {
        mockedGetVersion.mockResolvedValue(aFirmwareInfo);
        mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

        const device = aDevice;

        getOnboardingStatePolling({
          deviceId: device.deviceId,
          pollingPeriodMs,
        }).subscribe({
          next: (value) => {
            expect(value.onboardingState).toBeNull();
            expect(value.allowedError).toBeInstanceOf(TimeoutError);
            done();
          },
        });

        // Waits more than the timeout
        jest.advanceTimersByTime(pollingPeriodMs + 1);
      });
    });

    describe("and when the error is fatal and thrown before the defined timeout", () => {
      it("should notify the consumer that a unallowed error occurred", (done) => {
        mockedGetVersion.mockRejectedValue(new Error("Unknown error"));

        const device = aDevice;

        getOnboardingStatePolling({
          deviceId: device.deviceId,
          pollingPeriodMs,
        }).subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe("Unknown error");
            done();
          },
        });

        jest.runOnlyPendingTimers();
      });
    });
  });

  describe("When the fetched device state is incorrect", () => {
    it("should return a null onboarding state, and keep track of the extract error", (done) => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockImplementation(() => {
        throw new DeviceExtractOnboardingStateError(
          "Some incorrect device info"
        );
      });

      const device = aDevice;

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        pollingPeriodMs,
      }).subscribe({
        next: (value) => {
          expect(value.onboardingState).toBeNull();
          expect(value.allowedError).toBeInstanceOf(
            DeviceExtractOnboardingStateError
          );
          done();
        },
      });

      jest.runOnlyPendingTimers();
    });
  });

  describe("When polling returns a correct device state", () => {
    it("should return a correct onboarding state", (done) => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        pollingPeriodMs,
      }).subscribe({
        next: (value) => {
          expect(value.onboardingState).toEqual(anOnboardingState);
          expect(value.allowedError).toBeNull();
          done();
        },
        error: (error) => {
          done(error);
        },
      });

      jest.runOnlyPendingTimers();
    });

    it("should poll a new onboarding state after the defined period of time", (done) => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;

      // Did not manage to test that the polling is repeated by using jest's fake timer
      // and advanceTimersByTime method or equivalent.
      // Hacky test: spy on the repeat operator to see if it has been called.
      const spiedRepeat = jest.spyOn(rxjsOperators, "repeat");

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        pollingPeriodMs,
      }).subscribe({
        next: (value) => {
          expect(value.onboardingState).toEqual(anOnboardingState);
          expect(value.allowedError).toBeNull();
          expect(spiedRepeat).toHaveBeenCalledTimes(1);
          done();
        },
        error: (error) => {
          done(error);
        },
      });

      jest.runOnlyPendingTimers();
    });
  });
});
