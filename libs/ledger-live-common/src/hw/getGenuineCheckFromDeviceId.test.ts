import { from, of } from "rxjs";
import { delay } from "rxjs/operators";
import Transport from "@ledgerhq/hw-transport";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import genuineCheck from "./genuineCheck";
import { DeviceInfo } from "@ledgerhq/types-live";
import {
  getGenuineCheckFromDeviceId,
  GetGenuineCheckFromDeviceIdResult,
} from "./getGenuineCheckFromDeviceId";

jest.mock("./deviceAccess");
jest.mock("./getDeviceInfo");
jest.mock("./genuineCheck");
jest.useFakeTimers();

const mockedGetDeviceInfo = jest.mocked(getDeviceInfo);
const mockedGenuineCheck = jest.mocked(genuineCheck);
const mockedWithDevice = jest.mocked(withDevice);

mockedWithDevice.mockReturnValue((job) => from(job(new Transport())));

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
    mockedGetDeviceInfo.mockResolvedValue(aDeviceInfo);
  });

  afterEach(() => {
    mockedGetDeviceInfo.mockClear();
    mockedGenuineCheck.mockClear();
    jest.clearAllTimers();
  });

  describe("When the device is locked before doing a genuine check, and it timed out", () => {
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
          jest.advanceTimersByTime(1);
          step += 1;
        },
      });

      jest.advanceTimersByTime(1000);
    });
  });
});
