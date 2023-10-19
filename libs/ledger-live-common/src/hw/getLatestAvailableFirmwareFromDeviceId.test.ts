import { from, Observable, of, timer } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import getDeviceInfo from "./getDeviceInfo";
import manager from "../manager";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import {
  getLatestAvailableFirmwareFromDeviceId,
  GetLatestAvailableFirmwareFromDeviceIdResult,
} from "./getLatestAvailableFirmwareFromDeviceId";
import { LockedDeviceError } from "@ledgerhq/errors";
import { aDeviceInfoBuilder } from "../mock/fixtures/aDeviceInfo";
import { aLatestFirmwareContextBuilder } from "../mock/fixtures/aLatestFirmwareContext";

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

jest.mock("../manager");
const mockedGetLatestFirmwareForDevice = jest.mocked(manager.getLatestFirmwareForDevice);

jest.mock("./getDeviceInfo");
const mockedGetDeviceInfo = jest.mocked(getDeviceInfo);

describe("getLatestAvailableFirmwareFromDeviceId", () => {
  let aDeviceInfo: DeviceInfo;
  let aLatestFirmwareContext: FirmwareUpdateContext;

  beforeEach(() => {
    aDeviceInfo = aDeviceInfoBuilder();
    aLatestFirmwareContext = aLatestFirmwareContextBuilder();

    // @ts-expect-error the mocked function expects an Observable<0>
    // while we give it an Observable<1>, timer has multiple signatures and I can't figure
    // out why it doesn't understand the correct one
    mockedTimer.mockReturnValue(of(1));
  });

  afterEach(() => {
    mockedGetDeviceInfo.mockClear();
    mockedGetLatestFirmwareForDevice.mockClear();
    mockedTimer.mockClear();
    jest.clearAllTimers();
  });

  describe("The device is in a correct state", () => {
    it("should return the latest available firmware for the device", done => {
      // Happy path
      mockedGetDeviceInfo.mockResolvedValue(aDeviceInfo);
      mockedGetLatestFirmwareForDevice.mockResolvedValue(aLatestFirmwareContext);

      let step = 1;

      getLatestAvailableFirmwareFromDeviceId({
        deviceId: "A_DEVICE_ID",
      }).subscribe({
        next: ({
          firmwareUpdateContext,
          deviceInfo,
          lockedDevice,
          status,
        }: GetLatestAvailableFirmwareFromDeviceIdResult) => {
          try {
            switch (step) {
              case 1:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("started");
                // No need to advance the timer, as the retry timer is mocked to return directly, without a timeout
                break;
              case 2:
                expect(firmwareUpdateContext).toEqual(aLatestFirmwareContext);
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("done");
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

  describe("The device is locked, and the mechanism to know that a device is locked is a 0x5515 locked-device response", () => {
    it("should notify the function consumer of the need to unlock the device, and once done, continue the get latest available firmware flow", done => {
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

      mockedGetLatestFirmwareForDevice.mockResolvedValue(aLatestFirmwareContext);

      let step = 1;
      getLatestAvailableFirmwareFromDeviceId({
        deviceId: "A_DEVICE_ID",
      }).subscribe({
        next: ({
          firmwareUpdateContext,
          deviceInfo,
          lockedDevice,
          status,
        }: GetLatestAvailableFirmwareFromDeviceIdResult) => {
          try {
            switch (step) {
              case 1:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toBeNull();
                expect(lockedDevice).toBe(true);
                expect(status).toBe("started");
                // No need to advance the timer, as the retry timer is mocked to return directly, without a timeout
                break;
              // A retry happened, this time with an unlocked device
              case 2:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("started");
                break;
              case 3:
                expect(firmwareUpdateContext).toEqual(aLatestFirmwareContext);
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("done");
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

    describe("And the getLatestAvailableFirmware consumer unsubscribed before unlocking the device", () => {
      beforeEach(() => {
        // Mocked timer: pushes and complete after a timeout
        // Needed so the retry is not triggered before unsubscribing during our test

        // @ts-expect-error the mocked function expects an Observable<0>
        // while we give it an Observable<1>, timer has multiple signatures and I can't figure
        // out why it doesn't understand the correct one
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

      it("should stop completely the getLatestAvailableFirmware flow", done => {
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

        mockedGetLatestFirmwareForDevice.mockResolvedValue(aLatestFirmwareContext);

        let step = 1;
        const subscriber = getLatestAvailableFirmwareFromDeviceId({
          deviceId: "A_DEVICE_ID",
        }).subscribe({
          next: ({
            firmwareUpdateContext,
            lockedDevice,
            status,
          }: GetLatestAvailableFirmwareFromDeviceIdResult) => {
            try {
              switch (step) {
                case 1:
                  expect(firmwareUpdateContext).toBeNull();
                  expect(lockedDevice).toBe(true);
                  expect(status).toBe("started");
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

        // Step 1: Starts get latest available firmware, and the device is locked
        jest.advanceTimersByTime(1);

        // Tries to stop the flow after step 1
        expect(step).toEqual(2);
        subscriber.unsubscribe();
        // Step 2: Triggers any existing retry (if stopped correctly, there should be no retry)
        jest.runOnlyPendingTimers();
        // Checks if it was stopped correctly
        expect(mockedGetDeviceInfo).toBeCalledTimes(1);
        expect(mockedGetLatestFirmwareForDevice).toBeCalledTimes(0);
        done();
      });
    });
  });
});
