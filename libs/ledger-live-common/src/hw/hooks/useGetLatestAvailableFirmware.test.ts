import { of } from "rxjs";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { renderHook, act } from "@testing-library/react-hooks";
import { aLatestFirmwareContextBuilder } from "../../mock/fixtures/aLatestFirmwareContext";
import { aDeviceInfoBuilder } from "../../mock/fixtures/aDeviceInfo";
import { getLatestAvailableFirmwareFromDeviceId } from "../getLatestAvailableFirmwareFromDeviceId";
import { useGetLatestAvailableFirmware } from "./useGetLatestAvailableFirmware";

jest.mock("../getLatestAvailableFirmwareFromDeviceId");
jest.useFakeTimers();

const mockedGetLatestAvailableFirmwareFromDeviceId = jest.mocked(
  getLatestAvailableFirmwareFromDeviceId,
);

describe("useGetLatestAvailableFirmware", () => {
  let aLatestFirmwareContext: FirmwareUpdateContext;
  let aDeviceInfo: DeviceInfo;

  beforeEach(() => {
    aLatestFirmwareContext = aLatestFirmwareContextBuilder();
    aDeviceInfo = aDeviceInfoBuilder();
  });

  afterEach(() => {
    mockedGetLatestAvailableFirmwareFromDeviceId.mockClear();
    jest.clearAllTimers();
  });

  describe("When no new firmware update is available for a device", () => {
    it("should notify the hook consumer that there is no latest available firmware, and returns the device info", async () => {
      mockedGetLatestAvailableFirmwareFromDeviceId.mockReturnValue(
        of({
          firmwareUpdateContext: null,
          deviceInfo: aDeviceInfo,
          lockedDevice: false,
          status: "done",
        }),
      );
      const { result } = renderHook(() =>
        useGetLatestAvailableFirmware({
          getLatestAvailableFirmwareFromDeviceId: mockedGetLatestAvailableFirmwareFromDeviceId,
          deviceId: "A_DEVICE_ID",
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.status).toEqual("no-available-firmware");
      expect(result.current.error).toBeNull();
      expect(result.current.latestFirmware).toBeNull();
      expect(result.current.deviceInfo).toEqual(aDeviceInfo);
    });
  });

  describe("When a new firmware update is available for a device", () => {
    it("should notify the hook consumer that there is a new latest available firmware, and return the device info", async () => {
      mockedGetLatestAvailableFirmwareFromDeviceId.mockReturnValue(
        of({
          firmwareUpdateContext: aLatestFirmwareContext,
          deviceInfo: aDeviceInfo,
          lockedDevice: false,
          status: "done",
        }),
      );
      const { result } = renderHook(() =>
        useGetLatestAvailableFirmware({
          getLatestAvailableFirmwareFromDeviceId: mockedGetLatestAvailableFirmwareFromDeviceId,
          deviceId: "A_DEVICE_ID",
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.status).toEqual("available-firmware");
      expect(result.current.error).toBeNull();
      expect(result.current.latestFirmware).toEqual(aLatestFirmwareContext);
      expect(result.current.deviceInfo).toEqual(aDeviceInfo);
    });
  });

  describe("When the device is locked during the firmware update check", () => {
    it("should notify the hook consumer of the need to unlock the device", async () => {
      mockedGetLatestAvailableFirmwareFromDeviceId.mockReturnValue(
        of({
          firmwareUpdateContext: null,
          deviceInfo: null,
          lockedDevice: true,
          status: "started",
        }),
      );

      const { result } = renderHook(() =>
        useGetLatestAvailableFirmware({
          getLatestAvailableFirmwareFromDeviceId: mockedGetLatestAvailableFirmwareFromDeviceId,
          deviceId: "A_DEVICE_ID",
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.lockedDevice).toBe(true);
      expect(result.current.status).toEqual("checking");
      expect(result.current.error).toBeNull();
      expect(result.current.latestFirmware).toBeNull();
      expect(result.current.deviceInfo).toBeNull();
    });
  });
});
