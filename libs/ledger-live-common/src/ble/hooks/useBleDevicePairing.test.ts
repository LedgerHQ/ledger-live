import { renderHook, act } from "@testing-library/react-hooks";
import { from } from "rxjs";
import { DeviceModelId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";
import { withDevice } from "../../hw/deviceAccess";
import getAppAndVersion from "../../hw/getAppAndVersion";
import { useBleDevicePairing } from "./useBleDevicePairing";

jest.mock("../../hw/deviceAccess");
jest.mock("../../hw/getAppAndVersion");
jest.mock("@ledgerhq/hw-transport");
jest.useFakeTimers();

const mockedGetAppAndVersion = jest.mocked(getAppAndVersion);
const mockedWithDevice = jest.mocked(withDevice);

mockedWithDevice.mockReturnValue(job => from(job(new Transport())));

const anAppAndVersion = {
  name: "Bitcoin",
  version: "1.0.0",
  flags: 1,
};

const aDevice = {
  deviceId: "DEVICE_ID_A",
  deviceName: "DEVICE_NAME_A",
  modelId: DeviceModelId.stax,
  wired: false,
};

// FIXME: once we have our own definition of BleError class, this won't be needed
class BleError extends Error {
  errorCode: number;
  constructor(message: string, errorCode: number) {
    super(message);
    this.errorCode = errorCode;
  }
}

describe("useBleDevicePairing", () => {
  afterEach(() => {
    mockedGetAppAndVersion.mockClear();
    jest.clearAllTimers();
  });

  describe("When the request sent with the BLE transport to the device gets a success response", () => {
    beforeEach(() => {
      mockedGetAppAndVersion.mockResolvedValue(anAppAndVersion);
    });

    it("should inform the hook consumer that the device is paired", async () => {
      const { result } = renderHook(() =>
        useBleDevicePairing({
          deviceId: aDevice.deviceId,
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.isPaired).toBe(true);
      expect(result.current.pairingError).toBeNull();
    });
  });

  describe("When the request sent with the BLE transport is rejected with an error", () => {
    beforeEach(() => {
      const bleError = new BleError("An error during pairing", 201);
      mockedGetAppAndVersion.mockRejectedValue(bleError);
    });

    it("should inform the hook consumer an error occurred", async () => {
      const { result } = renderHook(() =>
        useBleDevicePairing({
          deviceId: aDevice.deviceId,
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.isPaired).toBe(false);
      expect(result.current.pairingError).not.toBeNull();
    });
  });
});
