import { renderHook, act } from "@testing-library/react-hooks";
import { from, of, throwError } from "rxjs";
import { delay } from "rxjs/operators";
import Transport from "@ledgerhq/hw-transport";
import { withDevice } from "../deviceAccess";
import getDeviceInfo from "../getDeviceInfo";
import genuineCheck from "../genuineCheck";
import { useGenuineCheck } from "./useGenuineCheck";
import {
  UserRefusedAllowManager,
  DisconnectedDeviceDuringOperation,
} from "@ledgerhq/errors";
import { DeviceInfo } from "../../types/manager";

jest.mock("../deviceAccess");
jest.mock("../getDeviceInfo");
jest.mock("../genuineCheck");
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

describe("useGenuineCheck", () => {
  beforeEach(() => {
    mockedGetDeviceInfo.mockResolvedValue(aDeviceInfo);
  });

  afterEach(() => {
    mockedGetDeviceInfo.mockClear();
    mockedGenuineCheck.mockClear();
    jest.clearAllTimers();
  });

  describe("When the genuine check requests for a device permission", () => {
    it("should notify the hook consumer of the request", async () => {
      mockedGenuineCheck.mockReturnValue(
        of({ type: "device-permission-requested", wording: "" })
      );
      const { result } = renderHook(() =>
        useGenuineCheck({
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.devicePermissionState).toEqual("requested");
      expect(result.current.genuineState).toEqual("unchecked");
      expect(result.current.error).toBeNull();
    });

    it("should notify the hook consumer if the device permission is granted", async () => {
      mockedGenuineCheck.mockReturnValue(
        of({ type: "device-permission-granted" })
      );
      const { result } = renderHook(() =>
        useGenuineCheck({
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.devicePermissionState).toEqual("granted");
      expect(result.current.genuineState).toEqual("unchecked");
      expect(result.current.error).toBeNull();
    });

    it("should notify the hook consumer if the device permission is refused", async () => {
      mockedGenuineCheck.mockReturnValue(
        throwError(new UserRefusedAllowManager())
      );
      const { result } = renderHook(() =>
        useGenuineCheck({
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.devicePermissionState).toEqual("refused");
      expect(result.current.genuineState).toEqual("unchecked");
      expect(result.current.error).toBeNull();
    });
  });

  describe("When an error occurred during the genuine check", () => {
    it("should notify the hook consumer that an error occurred", async () => {
      mockedGenuineCheck.mockReturnValue(
        throwError(new DisconnectedDeviceDuringOperation())
      );
      const { result } = renderHook(() =>
        useGenuineCheck({
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.genuineState).toEqual("unchecked");
      expect(result.current.error).toBeInstanceOf(
        DisconnectedDeviceDuringOperation
      );
    });
  });

  describe("When the genuine check is completed", () => {
    describe("and it is a success", () => {
      it("should notify the hook consumer of the success", async () => {
        mockedGenuineCheck.mockReturnValue(
          of({ type: "result", payload: "0000" })
        );
        const { result } = renderHook(() =>
          useGenuineCheck({
            deviceId: "A_DEVICE_ID",
          })
        );

        await act(async () => {
          jest.advanceTimersByTime(1);
        });

        expect(result.current.genuineState).toEqual("genuine");
        expect(result.current.error).toBeNull();
      });
    });

    describe("and the device is not genuine", () => {
      it("should notify the hook consumer that the device is not genuine", async () => {
        mockedGenuineCheck.mockReturnValue(
          of({ type: "result", payload: "1111" })
        );
        const { result } = renderHook(() =>
          useGenuineCheck({
            deviceId: "A_DEVICE_ID",
          })
        );

        await act(async () => {
          jest.advanceTimersByTime(1);
        });

        expect(result.current.genuineState).toEqual("non-genuine");
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("When the hook consumer requests to reset the genuine check state", () => {
    it("should reset the device permission and genuine states", async () => {
      // In the case of an unsuccessful genuine check
      mockedGenuineCheck.mockReturnValue(
        of(
          { type: "device-permission-granted" },
          { type: "result", payload: "1111" }
        )
      );

      const { result } = renderHook(() =>
        useGenuineCheck({
          isHookEnabled: true,
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.devicePermissionState).toEqual("granted");
      expect(result.current.genuineState).toEqual("non-genuine");
      expect(result.current.error).toBeNull();

      // We ask to reset the genuine check state
      await act(async () => {
        result.current.resetGenuineCheckState();
      });

      expect(result.current.devicePermissionState).toEqual("unrequested");
      expect(result.current.genuineState).toEqual("unchecked");
      expect(result.current.error).toBeNull();
    });
  });

  describe("When the device is locked before doing a genuine check, and it timed out", () => {
    it("should notify the hook consumer of the need to unlock the device, and once done, continue the genuine check flow", async () => {
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

      const { result } = renderHook(() =>
        useGenuineCheck({
          lockedDeviceTimeoutMs: 1000,
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.devicePermissionState).toEqual("unlock-needed");
      expect(result.current.genuineState).toEqual("unchecked");
      expect(result.current.error).toBeNull();

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.devicePermissionState).toEqual("requested");
      expect(result.current.genuineState).toEqual("unchecked");
      expect(result.current.error).toBeNull();
    });
  });
});
