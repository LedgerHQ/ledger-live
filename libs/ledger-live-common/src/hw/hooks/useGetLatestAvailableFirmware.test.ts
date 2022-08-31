import { FirmwareUpdateContext } from "@ledgerhq/types-live";
import { renderHook, act } from "@testing-library/react-hooks";
import { of } from "rxjs";
import { getLatestAvailableFirmwareFromDeviceId } from "../getLatestAvailableFirmwareFromDeviceId";
import { useGetLatestAvailableFirmware } from "./useGetLatestAvailableFirmware";

jest.mock("../getLatestAvailableFirmwareFromDeviceId");
jest.useFakeTimers();

const mockedGetLatestAvailableFirmwareFromDeviceId = jest.mocked(
  getLatestAvailableFirmwareFromDeviceId
);

const aLatestFirmwareContext: FirmwareUpdateContext = {
  osu: {
    next_se_firmware_final_version: 1,
    previous_se_firmware_final_version: [],
    id: 0,
    name: "OSU",
    description: null,
    display_name: null,
    notes: null,
    perso: "",
    firmware: "",
    firmware_key: "",
    hash: "",
    date_creation: "",
    date_last_modified: "",
    device_versions: [],
    providers: [],
  },
  final: {
    id: 1,
    name: "FINAL",
    description: null,
    display_name: null,
    notes: null,
    perso: "",
    firmware: "",
    firmware_key: "",
    hash: "",
    date_creation: "",
    date_last_modified: "",
    device_versions: [],
    providers: [],
    version: "",
    se_firmware: 1,
    osu_versions: [],
    mcu_versions: [],
    application_versions: [],
  },
  shouldFlashMCU: false,
};

// TODO: rename into useGetLatestAvailableFirmware ?
describe("useGetLatestAvailableFirmware", () => {
  afterEach(() => {
    mockedGetLatestAvailableFirmwareFromDeviceId.mockClear();
    jest.clearAllTimers();
  });

  describe("When no new firmware update is available for a device", () => {
    it("should notify the hook consumer that there is no latest available firmware", async () => {
      mockedGetLatestAvailableFirmwareFromDeviceId.mockReturnValue(
        of({
          firmwareUpdateContext: undefined,
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
});
