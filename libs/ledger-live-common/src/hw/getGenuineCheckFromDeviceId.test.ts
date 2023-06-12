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
    withDevice: jest.fn().mockReturnValue(job => {
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
    // Mocked timer: directly pushes and complete
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
      it("should notify the function consumer of the need to unlock the device, and once done, continue the genuine check flow", done => {
        // Delays the device info response
        mockedGetDeviceInfo.mockReturnValue(
          of(aDeviceInfo as DeviceInfo)
            .pipe(delay(1001))
            .toPromise(),
        );

        mockedGenuineCheck.mockReturnValue(
          of({
            type: "device-permission-requested",
            wording: "",
          }),
        );

        let step = 1;
        getGenuineCheckFromDeviceId({
          deviceId: "A_DEVICE_ID",
          lockedDeviceTimeoutMs: 1000,
        }).subscribe({
          next: ({ socketEvent, lockedDevice }: GetGenuineCheckFromDeviceIdResult) => {
            try {
              switch (step) {
                case 1:
                  expect(socketEvent).toBeNull();
                  expect(lockedDevice).toBe(true);
                  break;
                case 2:
                  expect(socketEvent).toBeNull();
                  expect(lockedDevice).toBe(false);
                  break;
                case 3:
                  expect(socketEvent).toEqual({
                    type: "device-permission-requested",
                    wording: "",
                  });
                  expect(lockedDevice).toBe(false);
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

        // Unresponsive timeout is triggered
        jest.advanceTimersByTime(1000);
      });
    });

    describe("And the mechanism to know that a device is locked is a 0x5515 locked-device response", () => {
      it("should notify the function consumer of the need to unlock the device, and once done, continue the genuine check flow", done => {
        let count = 0;
        // Could not simply mockedRejectValueOnce followed by a mockedResolveValueOnce.
        // Needed to transform getDeviceInfo into an Observable.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore returning an Observable and not a Promise.
        mockedGetDeviceInfo.mockImplementation(() => {
          return new Observable<DeviceInfo>(o => {
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
          }),
        );

        let step = 1;
        getGenuineCheckFromDeviceId({
          deviceId: "A_DEVICE_ID",
          lockedDeviceTimeoutMs: 1000,
        }).subscribe({
          next: ({ socketEvent, lockedDevice }: GetGenuineCheckFromDeviceIdResult) => {
            try {
              switch (step) {
                case 1:
                  expect(socketEvent).toBeNull();
                  expect(lockedDevice).toBe(true);
                  // No need to advance the timer, as the retry timer is mocked to return directly, without a timeout
                  break;
                // A retry happened, this time with an unlocked device
                case 2:
                  expect(socketEvent).toBeNull();
                  expect(lockedDevice).toBe(false);
                  break;
                case 3:
                  expect(socketEvent).toEqual({
                    type: "device-permission-requested",
                    wording: "",
                  });
                  expect(lockedDevice).toBe(false);
                  done();
                  break;
              }
            } catch (expectError) {
              done(expectError);
            }

            step += 1;
          },
        });
      });
    });

    describe("And the genuine check consumer unsubscribed before unlocking the device", () => {
      beforeEach(() => {
        // Mocked timer: pushes and complete after a timeout
        // Needed so the retry is not triggered before unsubscribing during our test
        mockedTimer.mockImplementation((dueTime?: number | Date) => {
          if (typeof dueTime === "number") {
            return new Observable<number>(subscriber => {
              setTimeout(() => {
                subscriber.next(1);
              }, dueTime);
            });
          } else {
            return of(1);
          }
        });
      });

      it("should stop the genuine check flow, to avoid sending an allow-secure-channel request to the device after unlocking it", done => {
        let count = 0;
        // Could not simply mockedRejectValueOnce followed by a mockedResolveValueOnce.
        // Needed to transform getDeviceInfo into an Observable.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore returning an Observable and not a Promise.
        mockedGetDeviceInfo.mockImplementation(() => {
          return new Observable<DeviceInfo>(o => {
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
          }),
        );

        let step = 1;
        const subscriber = getGenuineCheckFromDeviceId({
          deviceId: "A_DEVICE_ID",
          lockedDeviceTimeoutMs: 1000,
        }).subscribe({
          next: ({ socketEvent, lockedDevice }: GetGenuineCheckFromDeviceIdResult) => {
            try {
              switch (step) {
                case 1:
                  expect(socketEvent).toBeNull();
                  expect(lockedDevice).toBe(true);
                  break;
                case 2:
                  done("A retry happened, this should never be reached here");
                  break;
              }
            } catch (expectError) {
              done(expectError);
            }

            step += 1;
          },
        });

        // Step 1: Starts the genuine check, and the device is locked
        jest.advanceTimersByTime(1);

        // Tries to stop the genuine check after step 1
        expect(step).toEqual(2);
        subscriber.unsubscribe();
        // Step 2: Triggers any existing retry (if stopped correctly, there should be no retry)
        jest.runOnlyPendingTimers();
        // Checks if it was stopped correctly
        expect(mockedGetDeviceInfo).toBeCalledTimes(1);
        expect(mockedGenuineCheck).toBeCalledTimes(0);
        done();
      });
    });
  });

  describe("When the device is locked DURING the genuine check", () => {
    describe("And the mechanism to know that a device is locked is a 0x5515 locked-device response", () => {
      it("should notify the function consumer of the need to unlock the device, and once done, continue the genuine check flow", done => {
        mockedGetDeviceInfo.mockResolvedValue(aDeviceInfo);

        let count = 0;
        mockedGenuineCheck.mockImplementation(() => {
          return new Observable<SocketEvent>(o => {
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

        let step = 1;
        getGenuineCheckFromDeviceId({
          deviceId: "A_DEVICE_ID",
          lockedDeviceTimeoutMs: 1000,
        }).subscribe({
          next: ({ socketEvent, lockedDevice }: GetGenuineCheckFromDeviceIdResult) => {
            try {
              switch (step) {
                // No locked device at first
                case 1:
                  expect(lockedDevice).toBe(false);
                  expect(socketEvent).toBeNull();
                  break;
                // The locked device happens during the genuine check
                case 2:
                  expect(socketEvent).toBeNull();
                  expect(lockedDevice).toBe(true);
                  // No need to advance the timer, as the retry timer is mocked to return directly, without a timeout
                  break;
                // A retry happened, this time with an unlocked device
                case 3:
                  expect(socketEvent).toBeNull();
                  expect(lockedDevice).toBe(false);
                  break;
                case 4:
                  expect(socketEvent).toEqual({
                    type: "device-permission-requested",
                    wording: "",
                  });
                  expect(lockedDevice).toBe(false);
                  done();
                  break;
              }
            } catch (expectError) {
              done(expectError);
            }

            step += 1;
          },
        });
      });
    });
  });
});
