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
    withDevice: jest.fn().mockReturnValue((job) => {
      return from(job(new Transport()));
    }),
  };
});

jest.mock("../manager");
const mockedGetLatestFirmwareForDevice = jest.mocked(
  manager.getLatestFirmwareForDevice
);

jest.mock("./getDeviceInfo");
const mockedGetDeviceInfo = jest.mocked(getDeviceInfo);

describe("getLatestAvailableFirmwareFromDeviceId", () => {
  let aDeviceInfo: DeviceInfo;
  let aLatestFirmwareContext: FirmwareUpdateContext;

  beforeEach(() => {
    aDeviceInfo = aDeviceInfoBuilder();
    aLatestFirmwareContext = aLatestFirmwareContextBuilder();
    mockedTimer.mockReturnValue(of(1));
  });

  afterEach(() => {
    mockedGetDeviceInfo.mockClear();
    mockedGetLatestFirmwareForDevice.mockClear();
    mockedTimer.mockClear();
    jest.clearAllTimers();
  });

  describe("The device is locked, and the mechanism to know that a device is locked is a 0x5515 locked-device response", () => {
    it("should notify the function consumer of the need to unlock the device, and once done, continue the get latest available firmware flow", (done) => {
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

      mockedGetLatestFirmwareForDevice.mockResolvedValue(
        aLatestFirmwareContext
      );

      let step = 0;
      getLatestAvailableFirmwareFromDeviceId({
        deviceId: "A_DEVICE_ID",
      }).subscribe({
        next: ({
          firmwareUpdateContext,
          deviceIsLocked,
          status,
        }: GetLatestAvailableFirmwareFromDeviceIdResult) => {
          try {
            switch (step) {
              case 0:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceIsLocked).toBe(true);
                expect(status).toBe("started");
                break;
              // A retry happened, this time with an unlocked device
              case 1:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceIsLocked).toBe(false);
                expect(status).toBe("started");
                break;
              case 2:
                expect(firmwareUpdateContext).toEqual(aLatestFirmwareContext);
                expect(deviceIsLocked).toBe(false);
                expect(status).toBe("done");
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
