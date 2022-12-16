import { of } from "rxjs";
import { FirmwareUpdateContext } from "@ledgerhq/types-live";
import { renderHook, act } from "@testing-library/react-hooks";
import { aLatestFirmwareContextBuilder } from "../../mock/fixtures/aLatestFirmwareContext";
import { getLatestAvailableFirmwareFromDeviceId } from "../getLatestAvailableFirmwareFromDeviceId";
import { useGetLatestAvailableFirmware } from "./useGetLatestAvailableFirmware";

jest.mock("../getLatestAvailableFirmwareFromDeviceId");
jest.useFakeTimers();

const mockedGetLatestAvailableFirmwareFromDeviceId = jest.mocked(
  getLatestAvailableFirmwareFromDeviceId
);

describe("useGetLatestAvailableFirmware", () => {
  let aLatestFirmwareContext: FirmwareUpdateContext;

  beforeEach(() => {
    aLatestFirmwareContext = aLatestFirmwareContextBuilder();
  });

  afterEach(() => {
    mockedGetLatestAvailableFirmwareFromDeviceId.mockClear();
    jest.clearAllTimers();
  });

  describe("When no new firmware update is available for a device", () => {
    it("should notify the hook consumer that there is no latest available firmware", async () => {
      mockedGetLatestAvailableFirmwareFromDeviceId.mockReturnValue(
        of({
          firmwareUpdateContext: null,
          deviceIsLocked: false,
          status: "done",
        })
      );
      const { result } = renderHook(() =>
        useGetLatestAvailableFirmware({
          getLatestAvailableFirmwareFromDeviceId:
            mockedGetLatestAvailableFirmwareFromDeviceId,
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.status).toEqual("no-available-firmware");
      expect(result.current.error).toBeNull();
      expect(result.current.latestFirmware).toBeNull();
    });
  });

  describe("When a new firmware update is available for a device", () => {
    it("should notify the hook consumer that there is a new latest available firmware", async () => {
      mockedGetLatestAvailableFirmwareFromDeviceId.mockReturnValue(
        of({
          firmwareUpdateContext: aLatestFirmwareContext,
          deviceIsLocked: false,
          status: "done",
        })
      );
      const { result } = renderHook(() =>
        useGetLatestAvailableFirmware({
          getLatestAvailableFirmwareFromDeviceId:
            mockedGetLatestAvailableFirmwareFromDeviceId,
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.status).toEqual("available-firmware");
      expect(result.current.error).toBeNull();
      expect(result.current.latestFirmware).toEqual(aLatestFirmwareContext);
    });
  });

  describe("When the device is locked during the firmware update check", () => {
    it("should notify the hook consumer of the need to unlock the device", async () => {
      mockedGetLatestAvailableFirmwareFromDeviceId.mockReturnValue(
        of({
          firmwareUpdateContext: null,
          deviceIsLocked: true,
          status: "started",
        })
      );

      const { result } = renderHook(() =>
        useGetLatestAvailableFirmware({
          getLatestAvailableFirmwareFromDeviceId:
            mockedGetLatestAvailableFirmwareFromDeviceId,
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.deviceIsLocked).toBe(true);
      expect(result.current.status).toEqual("checking");
      expect(result.current.error).toBeNull();
      expect(result.current.latestFirmware).toBeNull();
    });
  });
});
