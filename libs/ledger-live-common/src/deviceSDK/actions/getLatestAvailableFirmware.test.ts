import { Observable, of } from "rxjs";
import { LockedDeviceError, TransportRaceCondition } from "@ledgerhq/errors";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";

import { getDeviceInfoTask, internalGetDeviceInfoTask } from "../tasks/getDeviceInfo";
import { getLatestFirmwareTask } from "../tasks/getLatestFirmware";
import { aDeviceInfoBuilder } from "../../mock/fixtures/aDeviceInfo";
import { aLatestFirmwareContextBuilder } from "../../mock/fixtures/aLatestFirmwareContext";
import {
  getLatestAvailableFirmwareAction,
  GetLatestAvailableFirmwareActionState,
} from "./getLatestAvailableFirmware";
import { sharedLogicTaskWrapper } from "../tasks/core";

// Needed for rxjs timeout
jest.useFakeTimers();
// Needs to mock the timer from rxjs used in the task retry mechanism (`retry` with `timer`)
jest.mock("rxjs", () => {
  const originalModule = jest.requireActual("rxjs");

  return {
    ...originalModule,
    timer: jest.fn(() => {
      return of(1);
    }),
  };
});

jest.mock("../tasks/getDeviceInfo");
// Going to test also the retry mechanism of the tasks associated to the action
const mockedInternalGetDeviceInfoTask = jest.mocked(internalGetDeviceInfoTask);
const mockedGetDeviceInfoTask = jest.mocked(getDeviceInfoTask);
// `sharedLogicTaskWrapper` contains the retry logic, and we want to test it.
// If we only mock `internalGetDeviceInfoTask`, `getDeviceInfoTask` will still be defined with the original
// `internalGetDeviceInfoTask` and not the mocked version. So we need to redefine it.
mockedGetDeviceInfoTask.mockImplementation(sharedLogicTaskWrapper(internalGetDeviceInfoTask));

jest.mock("../tasks/getLatestFirmware");
const mockedGetLatestFirmwareTask = jest.mocked(getLatestFirmwareTask);

describe("getLatestAvailableFirmwareAction", () => {
  let aDeviceInfo: DeviceInfo;
  let aLatestFirmwareContext: FirmwareUpdateContext;

  beforeEach(() => {
    aDeviceInfo = aDeviceInfoBuilder();
    aLatestFirmwareContext = aLatestFirmwareContextBuilder();
    // mockedTimer.mockReturnValue(of(1));
  });

  afterEach(() => {
    mockedInternalGetDeviceInfoTask.mockClear();
    mockedGetLatestFirmwareTask.mockClear();
    // mockedTimer.mockClear();
    jest.clearAllTimers();
  });

  describe("The device is in a correct state", () => {
    it("should return the latest available firmware for the device if there is one", done => {
      // Happy path
      mockedInternalGetDeviceInfoTask.mockReturnValue(
        of({ type: "data", deviceInfo: aDeviceInfo }),
      );

      mockedGetLatestFirmwareTask.mockReturnValue(
        of({ type: "data", firmwareUpdateContext: aLatestFirmwareContext }),
      );

      let step = 1;

      getLatestAvailableFirmwareAction({
        deviceId: "A_DEVICE_ID",
      }).subscribe({
        next: ({
          firmwareUpdateContext,
          deviceInfo,
          lockedDevice,
          status,
        }: GetLatestAvailableFirmwareActionState) => {
          try {
            switch (step) {
              case 1:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toBeNull();
                expect(lockedDevice).toBe(false);
                expect(status).toBe("ongoing");
                break;
              case 2:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("ongoing");
                break;
              case 3:
                expect(firmwareUpdateContext).toEqual(aLatestFirmwareContext);
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("available-firmware");
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

    it("should return no latest available firmware information if there is none for the device", done => {
      // Happy path
      mockedInternalGetDeviceInfoTask.mockReturnValue(
        of({ type: "data", deviceInfo: aDeviceInfo }),
      );
      mockedGetLatestFirmwareTask.mockReturnValue(
        of({
          type: "taskError",
          error: "FirmwareUpToDate",
        }),
      );

      let step = 1;

      getLatestAvailableFirmwareAction({
        deviceId: "A_DEVICE_ID",
      }).subscribe({
        next: ({
          firmwareUpdateContext,
          deviceInfo,
          lockedDevice,
          status,
        }: GetLatestAvailableFirmwareActionState) => {
          try {
            switch (step) {
              case 1:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toBeNull();
                expect(lockedDevice).toBe(false);
                expect(status).toBe("ongoing");
                break;
              case 2:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("ongoing");
                break;
              case 3:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("no-available-firmware");
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

  describe("When the device is locked", () => {
    it("should notify the function consumer of the need to unlock the device, and once done, continue the get latest available firmware flow", done => {
      let count = 0;

      // Returns a LockedDeviceError first, then the device info pretending the device has been unlocked
      mockedInternalGetDeviceInfoTask.mockReturnValue(
        new Observable(o => {
          if (count < 1) {
            count++;
            // Mocks the internal task, some shared error are thrown (like `LockedDeviceError`)
            // and caught by the `sharedLogicTaskWrapper`
            o.error(new LockedDeviceError());
          } else {
            o.next({ type: "data", deviceInfo: aDeviceInfo });
          }
        }),
      );

      mockedGetLatestFirmwareTask.mockReturnValue(
        of({ type: "data", firmwareUpdateContext: aLatestFirmwareContext }),
      );

      let step = 1;
      getLatestAvailableFirmwareAction({
        deviceId: "A_DEVICE_ID",
      }).subscribe({
        next: ({
          firmwareUpdateContext,
          deviceInfo,
          lockedDevice,
          status,
          error,
        }: GetLatestAvailableFirmwareActionState) => {
          try {
            switch (step) {
              case 1:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toBeNull();
                expect(lockedDevice).toBe(false);
                expect(status).toBe("ongoing");
                expect(error).toBeNull();
                break;
              case 2:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toBeNull();
                expect(lockedDevice).toBe(true);
                // The actions is retrying its inner tasks on a locked device error
                expect(status).toBe("ongoing");
                expect(error).not.toBeNull();
                // No need to advance the timer, as the retry timer is mocked to return directly, without a timeout
                break;
              // A retry happened, this time with an unlocked device
              case 3:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("ongoing");
                expect(error).toBeNull();
                break;
              case 4:
                expect(firmwareUpdateContext).toEqual(aLatestFirmwareContext);
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("available-firmware");
                expect(error).toBeNull();
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

  describe("When another APDU/action was ongoing, and a Transport race condition occurred", () => {
    it("should notify the function consumer of the need to unlock the device, and once done, continue the get latest available firmware flow", done => {
      let count = 0;

      // Returns a LockedDeviceError first, then the device info pretending the device has been unlocked
      mockedInternalGetDeviceInfoTask.mockReturnValue(
        new Observable(o => {
          if (count < 1) {
            count++;
            // Mocks the internal task, some shared error are thrown (like `TransportRaceCondition`)
            // and caught by the `sharedLogicTaskWrapper`
            o.error(new TransportRaceCondition());
          } else {
            o.next({ type: "data", deviceInfo: aDeviceInfo });
          }
        }),
      );

      mockedGetLatestFirmwareTask.mockReturnValue(
        of({ type: "data", firmwareUpdateContext: aLatestFirmwareContext }),
      );

      let step = 1;
      getLatestAvailableFirmwareAction({
        deviceId: "A_DEVICE_ID",
      }).subscribe({
        next: ({
          firmwareUpdateContext,
          deviceInfo,
          lockedDevice,
          status,
          error,
        }: GetLatestAvailableFirmwareActionState) => {
          try {
            switch (step) {
              case 1:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toBeNull();
                expect(lockedDevice).toBe(false);
                expect(status).toBe("ongoing");
                expect(error).toBeNull();
                break;
              case 2:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toBeNull();
                expect(lockedDevice).toBe(false);
                // The actions is retrying its inner tasks on a locked device error
                expect(status).toBe("ongoing");
                expect(error).toEqual(
                  expect.objectContaining({
                    type: "SharedError",
                    name: "TransportRaceCondition",
                    retrying: true,
                  }),
                );
                // No need to advance the timer, as the retry timer is mocked to return directly, without a timeout
                break;
              // A retry happened, this time with an unlocked device
              case 3:
                expect(firmwareUpdateContext).toBeNull();
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("ongoing");
                expect(error).toBeNull();
                break;
              case 4:
                expect(firmwareUpdateContext).toEqual(aLatestFirmwareContext);
                expect(deviceInfo).toEqual(aDeviceInfo);
                expect(lockedDevice).toBe(false);
                expect(status).toBe("available-firmware");
                expect(error).toBeNull();
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
