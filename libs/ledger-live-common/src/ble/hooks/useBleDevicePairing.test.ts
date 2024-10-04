/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { from } from "rxjs";
import { DeviceModelId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";
import { withDevice } from "../../hw/deviceAccess";
import { getVersion } from "../../device/use-cases/getVersionUseCase";
import { useBleDevicePairing } from "./useBleDevicePairing";
import getAppAndVersion from "../../hw/getAppAndVersion";
import quitApp from "../../hw/quitApp";
import { isDashboardName } from "../../hw/isDashboardName";
import { LockedDeviceError } from "@ledgerhq/errors";

jest.mock("../../hw/deviceAccess");
jest.mock("../../device/use-cases/getVersionUseCase");
jest.mock("../../hw/getAppAndVersion");
jest.mock("../../hw/quitApp");
jest.mock("../../hw/isDashboardName");
jest.mock("@ledgerhq/hw-transport");
jest.useFakeTimers();

const mockedWithDevice = jest.mocked(withDevice);
const mockedGetVersion = jest.mocked(getVersion);
const mockedGetAppAndVersion = jest.mocked(getAppAndVersion);
const mockedQuitApp = jest.mocked(quitApp);
const mockedIsDashboardName = jest.mocked(isDashboardName);

const transport = new Transport();
mockedWithDevice.mockReturnValue(job => from(job(transport)));

const aFirmwareInfo = {
  isBootloader: false,
  rawVersion: "",
  targetId: 0,
  mcuVersion: "",
  flags: Buffer.from([]),
};

const dashboardInfo = {
  name: "BOLOS",
  version: "1.0.0",
  flags: Buffer.from([]),
};

const appInfo = {
  name: "App",
  version: "1.0.0",
  flags: Buffer.from([]),
};

const aDevice = {
  deviceId: "DEVICE_ID_A",
  deviceName: "DEVICE_NAME_A",
  modelId: DeviceModelId.stax,
  wired: false,
};

class BleError extends Error {
  errorCode: number;
  constructor(message: string, errorCode: number) {
    super(message);
    this.errorCode = errorCode;
  }
}

describe("useBleDevicePairing", () => {
  afterEach(() => {
    mockedGetVersion.mockClear();
    mockedWithDevice.mockClear();
    mockedGetAppAndVersion.mockClear();
    mockedQuitApp.mockClear();
    mockedIsDashboardName.mockClear();
    jest.clearAllTimers();
  });

  describe("When the request sent with the BLE transport to the device gets a success response", () => {
    beforeEach(() => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedGetAppAndVersion.mockResolvedValue({
        name: "Dashboard",
        version: "1.0.0",
        flags: Buffer.from([]),
      });
      mockedIsDashboardName.mockReturnValue(true);
    });

    it("should inform the hook consumer that the device is paired", async () => {
      const { result } = renderHook(() =>
        useBleDevicePairing({
          deviceId: aDevice.deviceId,
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isPaired).toBe(true);
        expect(result.current.pairingError).toBeNull();
      });
    });
  });

  describe("When the request sent with the BLE transport is rejected with an error", () => {
    beforeEach(() => {
      const bleError = new BleError("An error during pairing", 201);
      mockedGetVersion.mockRejectedValue(bleError);
      mockedGetAppAndVersion.mockResolvedValue(dashboardInfo);
      mockedIsDashboardName.mockReturnValue(true);
    });

    it("should inform the hook consumer an error occurred", async () => {
      const { result } = renderHook(() =>
        useBleDevicePairing({
          deviceId: aDevice.deviceId,
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isPaired).toBe(false);
        expect(result.current.pairingError).not.toBeNull();
      });
    });
  });

  describe("When the device is not in dashboard mode", () => {
    beforeEach(() => {
      mockedGetAppAndVersion.mockResolvedValue(appInfo);
      mockedIsDashboardName.mockReturnValue(false);
      mockedQuitApp.mockResolvedValue(undefined);
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
    });

    it("should quit the current app and then check the version", async () => {
      const { result } = renderHook(() =>
        useBleDevicePairing({
          deviceId: aDevice.deviceId,
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockedQuitApp).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockedGetVersion).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(result.current.isPaired).toBe(true);
        expect(result.current.pairingError).toBeNull();
      });
    });
  });

  describe("When the device is locked and a LockedDeviceError is thrown", () => {
    beforeEach(() => {
      mockedGetAppAndVersion.mockResolvedValue(dashboardInfo);
      mockedIsDashboardName.mockReturnValue(true);

      let retryAttempt = 0;
      mockedGetVersion.mockImplementation(() => {
        retryAttempt += 1;
        if (retryAttempt < 3) {
          return Promise.reject(new LockedDeviceError("Device is locked"));
        }
        return Promise.resolve(aFirmwareInfo);
      });
    });

    it("should retry until the device is unlocked", async () => {
      const { result } = renderHook(() =>
        useBleDevicePairing({
          deviceId: aDevice.deviceId,
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isPaired).toBe(false);
      expect(result.current.pairingError).toBeInstanceOf(LockedDeviceError);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isPaired).toBe(false);
      expect(result.current.pairingError).toBeInstanceOf(LockedDeviceError);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isPaired).toBe(true);
        expect(result.current.pairingError).toBeNull();
      });
    });
  });
});
