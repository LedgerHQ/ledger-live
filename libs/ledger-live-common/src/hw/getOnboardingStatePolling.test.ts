import { getOnboardingStatePolling } from "./getOnboardingStatePolling";
import { from, of, Subscription, TimeoutError, Subject } from "rxjs";
import * as rxjsOperators from "rxjs/operators";
import { DeviceModelId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";
import {
  DeviceExtractOnboardingStateError,
  DisconnectedDevice,
  LockedDeviceError,
  TransportStatusError,
  StatusCodes,
  UnexpectedBootloader,
} from "@ledgerhq/errors";
import { withDevice } from "./deviceAccess";
import { getVersion } from "../device/use-cases/getVersionUseCase";
import { extractOnboardingState, OnboardingState, OnboardingStep } from "./extractOnboardingState";
import { SeedPhraseType } from "@ledgerhq/types-live";
import { DeviceDisconnectedWhileSendingError } from "@ledgerhq/device-management-kit";
import { quitApp } from "../deviceSDK/commands/quitApp";

jest.mock("../deviceSDK/commands/quitApp", () => {
  return {
    quitApp: jest.fn(() => of(undefined)), // immediately-completing observable
  };
});
jest.mock("./deviceAccess");
jest.mock("../device/use-cases/getVersionUseCase");
jest.mock("./extractOnboardingState");
jest.mock("@ledgerhq/hw-transport");
jest.useFakeTimers();

const aDevice = {
  deviceId: "DEVICE_ID_A",
  deviceName: "DEVICE_NAME_A",
  modelId: DeviceModelId.stax,
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
const mockedWithDevice = jest.mocked(withDevice);
const mockedQuitApp = jest.mocked(quitApp);
mockedWithDevice.mockReturnValue(job => from(job(new Transport())));

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
      charonSupported: false,
      charonStatus: null,
    };
  });

  afterEach(() => {
    mockedGetVersion.mockClear();
    mockedExtractOnboardingState.mockClear();
    mockedQuitApp.mockClear();
    mockedQuitApp.mockReturnValue(of(undefined));
    jest.clearAllTimers();
    onboardingStatePollingSubscription?.unsubscribe();
  });

  describe("When a communication error occurs while fetching the device state", () => {
    describe("and when the error is allowed and thrown before the defined timeout", () => {
      it("should update the onboarding state to null and keep track of the allowed error", done => {
        mockedGetVersion.mockRejectedValue(new DisconnectedDevice("An allowed error"));
        mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

        const device = aDevice;

        getOnboardingStatePolling({
          deviceId: device.deviceId,
          deviceName: null,
          pollingPeriodMs,
        }).subscribe({
          next: value => {
            try {
              expect(value.onboardingState).toBeNull();
              expect(value.allowedError).toBeInstanceOf(DisconnectedDevice);
              expect(value.lockedDevice).toBe(false);
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
        });

        // The timeout is equal to pollingPeriodMs by default
        jest.advanceTimersByTime(pollingPeriodMs - 1);
      });

      it("should update the onboarding state to null and keep track of the allowed DMK error", done => {
        mockedGetVersion.mockRejectedValue(
          new DeviceDisconnectedWhileSendingError("An allowed error"),
        );
        mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

        const device = aDevice;

        getOnboardingStatePolling({
          deviceId: device.deviceId,
          deviceName: null,
          pollingPeriodMs,
        }).subscribe({
          next: value => {
            try {
              expect(value.onboardingState).toBeNull();
              expect(value.allowedError).toBeInstanceOf(DeviceDisconnectedWhileSendingError);
              expect(value.lockedDevice).toBe(false);
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
        });

        // The timeout is equal to pollingPeriodMs by default
        jest.advanceTimersByTime(pollingPeriodMs - 1);
      });
    });

    describe("and when the error is due to a locked device", () => {
      it("should update the lockedDevice, update the onboarding state to null and keep track of the allowed error", done => {
        mockedGetVersion.mockRejectedValue(new LockedDeviceError());
        mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

        const device = aDevice;

        getOnboardingStatePolling({
          deviceId: device.deviceId,
          deviceName: null,
          pollingPeriodMs,
        }).subscribe({
          next: value => {
            try {
              expect(value.onboardingState).toBeNull();
              expect(value.allowedError).toBeInstanceOf(LockedDeviceError);
              expect(value.lockedDevice).toBe(true);
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
        });

        // The timeout is equal to pollingPeriodMs by default
        jest.advanceTimersByTime(pollingPeriodMs - 1);
      });
    });

    describe("and when a timeout occurred before the error (because the response from the device took too long)", () => {
      it("should update the allowed error value to notify the consumer", done => {
        const safeGuardTimeoutMs = pollingPeriodMs + 500;
        mockedGetVersion.mockResolvedValue(aFirmwareInfo);
        mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

        const device = aDevice;

        getOnboardingStatePolling({
          deviceId: device.deviceId,
          deviceName: null,
          pollingPeriodMs,
          safeGuardTimeoutMs,
        }).subscribe({
          next: value => {
            try {
              expect(value.onboardingState).toBeNull();
              expect(value.allowedError).toBeInstanceOf(TimeoutError);
              expect(value.lockedDevice).toBe(false);
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
        });

        // Waits more than the timeout
        jest.advanceTimersByTime(safeGuardTimeoutMs + 1);
      });
    });

    describe("and when the error is fatal and thrown before the defined timeout", () => {
      it("should notify the consumer that a unallowed error occurred", done => {
        mockedGetVersion.mockRejectedValue(new Error("Unknown error"));

        const device = aDevice;

        getOnboardingStatePolling({
          deviceId: device.deviceId,
          deviceName: null,
          pollingPeriodMs,
        }).subscribe({
          error: error => {
            try {
              expect(error).toBeInstanceOf(Error);
              expect(error?.message).toBe("Unknown error");
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
        });

        jest.advanceTimersByTime(pollingPeriodMs - 1);
      });
    });
  });

  describe("When the fetched device state is incorrect", () => {
    it("should return a null onboarding state, and keep track of the extract error", done => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockImplementation(() => {
        throw new DeviceExtractOnboardingStateError("Some incorrect device info");
      });

      const device = aDevice;

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
      }).subscribe({
        next: value => {
          try {
            expect(value.onboardingState).toBeNull();
            expect(value.allowedError).toBeInstanceOf(DeviceExtractOnboardingStateError);
            expect(value.lockedDevice).toBe(false);
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });

      jest.advanceTimersByTime(pollingPeriodMs - 1);
    });
  });

  describe("When polling returns a correct device state", () => {
    it("should return a correct onboarding state", done => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
      }).subscribe({
        next: value => {
          try {
            expect(value.allowedError).toBeNull();
            expect(value.onboardingState).toEqual(anOnboardingState);
            expect(value.lockedDevice).toBe(false);
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
        error: error => {
          done(error);
        },
      });

      jest.advanceTimersByTime(pollingPeriodMs - 1);
    });

    it("should poll a new onboarding state after the defined period of time", done => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;

      // Did not manage to test that the polling is repeated by using jest's fake timer
      // and advanceTimersByTime method or equivalent.
      // Hacky test: spy on the repeatWhen operator to see if it has been called.
      const spiedRepeat = jest.spyOn(rxjsOperators, "repeat");

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
        safeGuardTimeoutMs: pollingPeriodMs * 10,
      }).subscribe({
        next: value => {
          try {
            expect(value.onboardingState).toEqual(anOnboardingState);
            expect(value.allowedError).toBeNull();
            expect(value.lockedDevice).toBe(false);
            expect(spiedRepeat).toHaveBeenCalledTimes(1);
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
        error: error => {
          done(error);
        },
      });

      jest.advanceTimersByTime(pollingPeriodMs);
    });
    it("should not call quitApp when getVersion succeeds", done => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;

      getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
      }).subscribe({
        next: value => {
          try {
            expect(value.onboardingState).toEqual(anOnboardingState);
            expect(mockedQuitApp).not.toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        },
        error: err => done(err),
      });

      jest.advanceTimersByTime(pollingPeriodMs - 1);
    });

    it("should call quitApp and retry getVersion when getVersion fails with INS_NOT_SUPPORTED", done => {
      const insError = new TransportStatusError(StatusCodes.INS_NOT_SUPPORTED);
      mockedGetVersion.mockRejectedValueOnce(insError).mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
      }).subscribe({
        next: value => {
          try {
            expect(value.onboardingState).toEqual(anOnboardingState);
            expect(mockedQuitApp).toHaveBeenCalledTimes(1);
            expect(mockedGetVersion).toHaveBeenCalledTimes(2);
            done();
          } catch (err) {
            done(err);
          }
        },
        error: err => done(err),
      });

      jest.advanceTimersByTime(pollingPeriodMs - 1);
    });

    it("should only attempt quitApp once even if getVersion keeps failing with INS_NOT_SUPPORTED", async () => {
      const insError = new TransportStatusError(StatusCodes.INS_NOT_SUPPORTED);
      mockedGetVersion.mockRejectedValue(insError);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;
      const values: { onboardingState: OnboardingState | null; allowedError: Error | null }[] = [];

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
      }).subscribe({
        next: value => values.push(value),
      });

      await jest.advanceTimersByTimeAsync(pollingPeriodMs * 3);

      expect(values.length).toBeGreaterThanOrEqual(1);
      expect(values[0].onboardingState).toBeNull();
      expect(values[0].allowedError).toBeInstanceOf(TransportStatusError);
      expect(mockedQuitApp).toHaveBeenCalledTimes(1);
    });

    it("should not call getVersion retry until quitApp completes", async () => {
      const insError = new TransportStatusError(StatusCodes.INS_NOT_SUPPORTED);
      const quitAppSubject = new Subject<void>();
      mockedQuitApp.mockReturnValue(quitAppSubject.asObservable());
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const callOrder: string[] = [];
      let callCount = 0;

      mockedGetVersion.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          callOrder.push("getVersion:fail");
          return Promise.reject(insError);
        }
        callOrder.push("getVersion:success");
        return Promise.resolve(aFirmwareInfo);
      });

      const device = aDevice;
      const values: { onboardingState: OnboardingState | null }[] = [];

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
      }).subscribe({
        next: value => values.push(value),
      });

      // Flush microtasks so the first getVersion rejection is processed
      await Promise.resolve();
      await Promise.resolve();

      expect(mockedQuitApp).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual(["getVersion:fail"]);

      callOrder.push("quitApp completed");
      quitAppSubject.next();
      quitAppSubject.complete();

      // Flush microtasks for the retry getVersion
      await Promise.resolve();
      await Promise.resolve();

      expect(callOrder).toEqual(["getVersion:fail", "quitApp completed", "getVersion:success"]);
      expect(values[0].onboardingState).toEqual(anOnboardingState);
    });
  });

  describe("When the device is in bootloader mode", () => {
    it("should throw an error so it is considered a fatal error", done => {
      mockedGetVersion.mockResolvedValue({ ...aFirmwareInfo, isBootloader: true });

      const device = aDevice;

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
      }).subscribe({
        next: value => {
          done(`It should have thrown an error. Received value: ${JSON.stringify(value)}`);
        },
        error: error => {
          try {
            expect(error).toBeInstanceOf(UnexpectedBootloader);
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });

      jest.advanceTimersByTime(pollingPeriodMs - 1);
    });

    it("should not call quitApp when device is in bootloader (getVersion succeeds)", done => {
      mockedGetVersion.mockResolvedValue({ ...aFirmwareInfo, isBootloader: true });

      const device = aDevice;

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: null,
        pollingPeriodMs,
      }).subscribe({
        error: error => {
          try {
            expect(error).toBeInstanceOf(UnexpectedBootloader);
            expect(mockedQuitApp).not.toHaveBeenCalled();
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });

      jest.advanceTimersByTime(pollingPeriodMs - 1);
    });
  });

  describe("When deviceName is provided", () => {
    it("should pass deviceName to withDevice", done => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;

      getOnboardingStatePolling({
        deviceId: device.deviceId,
        deviceName: "My Device",
        pollingPeriodMs,
      }).subscribe({
        next: () => {
          expect(mockedWithDevice).toHaveBeenCalledWith(
            device.deviceId,
            expect.objectContaining({ matchDeviceByName: "My Device" }),
          );
          done();
        },
      });

      jest.advanceTimersByTime(pollingPeriodMs - 1);
    });
  });
});
