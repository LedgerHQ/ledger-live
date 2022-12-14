import { from, Observable, of, timer } from "rxjs";
import { delay } from "rxjs/operators";
import Transport from "@ledgerhq/hw-transport";
import getDeviceInfo from "./getDeviceInfo";
import genuineCheck from "./genuineCheck";
import { DeviceInfo, SocketEvent } from "@ledgerhq/types-live";
import {
  getGenuineCheckFromDeviceId,
  GetGenuineCheckFromDeviceIdResult,
} from "./getGenuineCheckFromDeviceId";
import { LockedDeviceError } from "@ledgerhq/errors";

jest.useFakeTimers();
// Needs to mock the timer from rxjs used in retryWhileErrors
jest.mock("rxjs", () => {
  const originalModule = jest.requireActual("rxjs");

  return {
    ...originalModule,
    timer: jest.fn(),
  };
});
const mockedTimer = jest.mocked(timer);

// Only mocks withDevice
jest.mock("./deviceAccess", () => {
  const originalModule = jest.requireActual("./deviceAccess");

  return {
    ...originalModule, // import and retain the original functionalities
    withDevice: jest.fn().mockReturnValue((job) => {
      return from(job(new Transport()));
    }),
  };
});

jest.mock("./getDeviceInfo");
jest.mock("./genuineCheck");

const mockedGetDeviceInfo = jest.mocked(getDeviceInfo);
const mockedGenuineCheck = jest.mocked(genuineCheck);

const aDeviceInfo = {
  mcuVersion: "A_MCU_VERSION",
  version: "A_VERSION",
  majMin: "A_MAJ_MIN",
  targetId: "0.0",
  isBootloader: true,
  isOSU: true,
  providerName: undefined,
  managerAllowed: false,
  pinValidated: true,
};

describe("getGenuineCheckFromDeviceId", () => {
  beforeEach(() => {
    mockedTimer.mockReturnValue(of(1));
  });

  afterEach(() => {
    mockedGetDeviceInfo.mockClear();
    mockedGenuineCheck.mockClear();
    mockedTimer.mockClear();
    jest.clearAllTimers();
  });

  describe("When the device is locked BEFORE doing a genuine check", () => {
    describe("And the mechanism to know that a device is locked is timing out", () => {
      it("should notify the function consumer of the need to unlock the device, and once done, continue the genuine check flow", (done) => {
        // Delays the device info response
        mockedGetDeviceInfo.mockReturnValue(
          of(aDeviceInfo as DeviceInfo)
            .pipe(delay(1001))
            .toPromise()
        );

        mockedGenuineCheck.mockReturnValue(
          of({
            type: "device-permission-requested",
            wording: "",
          })
        );

        let step = 0;
        getGenuineCheckFromDeviceId({
          deviceId: "A_DEVICE_ID",
          lockedDeviceTimeoutMs: 1000,
        }).subscribe({
          next: ({
            socketEvent,
            deviceIsLocked,
          }: GetGenuineCheckFromDeviceIdResult) => {
            try {
              switch (step) {
                case 0:
                  expect(socketEvent).toBeNull();
                  expect(deviceIsLocked).toBe(true);
                  break;
                case 1:
                  expect(socketEvent).toBeNull();
                  expect(deviceIsLocked).toBe(false);
                  break;
                case 2:
                  expect(socketEvent).toEqual({
                    type: "device-permission-requested",
                    wording: "",
                  });
                  expect(deviceIsLocked).toBe(false);
                  done();
                  break;
              }
            } catch (expectError) {
              done(expectError);
            }

            jest.advanceTimersByTime(1);
            step += 1;
          },
        });

        jest.advanceTimersByTime(1000);
      });
    });

    describe("And the mechanism to know that a device is locked is a 0x5515 locked-device response", () => {
      it("should notify the function consumer of the need to unlock the device, and once done, continue the genuine check flow", (done) => {
        let count = 0;
        // Could not simply mockedRejectValueOnce followed by a mockedResolveValueOnce.
        // Needed to transform getDeviceInfo into an Observable.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore returning an Observable and not a Promise.
        mockedGetDeviceInfo.mockImplementation(() => {
          return new Observable<DeviceInfo>((o) => {
            if (count < 1) {
              count++;
              o.error(new LockedDeviceError("Locked device"));
            } else {
              o.next(aDeviceInfo);
            }
          });
        });

        mockedGenuineCheck.mockReturnValue(
          of({
            type: "device-permission-requested",
            wording: "",
          })
        );

        let step = 0;
        getGenuineCheckFromDeviceId({
          deviceId: "A_DEVICE_ID",
          lockedDeviceTimeoutMs: 1000,
        }).subscribe({
          next: ({
            socketEvent,
            deviceIsLocked,
          }: GetGenuineCheckFromDeviceIdResult) => {
            try {
              switch (step) {
                case 0:
                  expect(socketEvent).toBeNull();
                  expect(deviceIsLocked).toBe(true);
                  break;
                // A retry happened, this time with an unlocked device
                case 1:
                  expect(socketEvent).toBeNull();
                  expect(deviceIsLocked).toBe(false);
                  break;
                case 2:
                  expect(socketEvent).toEqual({
                    type: "device-permission-requested",
                    wording: "",
                  });
                  expect(deviceIsLocked).toBe(false);
                  done();
                  break;
              }
            } catch (expectError) {
              done(expectError);
            }

            // No need to handle the timer with a specific value as rxjs timer has been mocked
            // because we could not advance the timer every time the retryWhileErrors is called
            jest.advanceTimersByTime(1);
            step += 1;
          },
        });

        jest.advanceTimersByTime(1);
      });
    });
  });

  describe("When the device is locked DURING the genuine check", () => {
    describe("And the mechanism to know that a device is locked is a 0x5515 locked-device response", () => {
      it("should notify the function consumer of the need to unlock the device, and once done, continue the genuine check flow", (done) => {
        mockedGetDeviceInfo.mockResolvedValue(aDeviceInfo);

        let count = 0;
        mockedGenuineCheck.mockImplementation(() => {
          return new Observable<SocketEvent>((o) => {
            if (count < 1) {
              count++;
              o.error(new LockedDeviceError("Locked device"));
            } else {
              o.next({
                type: "device-permission-requested",
                wording: "",
              });
            }
          });
        });

        let step = 0;
        getGenuineCheckFromDeviceId({
          deviceId: "A_DEVICE_ID",
          lockedDeviceTimeoutMs: 1000,
        }).subscribe({
          next: ({
            socketEvent,
            deviceIsLocked,
          }: GetGenuineCheckFromDeviceIdResult) => {
            try {
              switch (step) {
                // No locked device at first
                case 0:
                  expect(socketEvent).toBeNull();
                  expect(deviceIsLocked).toBe(false);
                  break;
                // The locked device happens during the genuine check
                case 1:
                  expect(socketEvent).toBeNull();
                  expect(deviceIsLocked).toBe(true);
                  break;
                // A retry happened, this time with an unlocked device
                case 2:
                  expect(socketEvent).toBeNull();
                  expect(deviceIsLocked).toBe(false);
                  break;
                case 3:
                  expect(socketEvent).toEqual({
                    type: "device-permission-requested",
                    wording: "",
                  });
                  expect(deviceIsLocked).toBe(false);
                  done();
                  break;
              }
            } catch (expectError) {
              done(expectError);
            }

            // No need to handle the timer with a specific value as rxjs timer has been mocked
            // because we could not advance the timer every time the retryWhileErrors is called
            jest.advanceTimersByTime(1);
            step += 1;
          },
        });

        jest.advanceTimersByTime(1);
      });
    });
  });
});
