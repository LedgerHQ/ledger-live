import { renderHook, act } from "@testing-library/react-hooks";
import { of, throwError } from "rxjs";
import {
  UserRefusedAllowManager,
  DisconnectedDeviceDuringOperation,
} from "@ledgerhq/errors";
import { useGenuineCheck } from "./useGenuineCheck";
import { getGenuineCheckFromDeviceId } from "../getGenuineCheckFromDeviceId";

jest.mock("../getGenuineCheckFromDeviceId");
jest.useFakeTimers();

const mockedGetGenuineCheckFromDeviceId = jest.mocked(
  getGenuineCheckFromDeviceId
);

describe("useGenuineCheck", () => {
  afterEach(() => {
    mockedGetGenuineCheckFromDeviceId.mockClear();
    jest.clearAllTimers();
  });

  describe("When the genuine check requests for a device permission", () => {
    it("should notify the hook consumer of the request", async () => {
      mockedGetGenuineCheckFromDeviceId.mockReturnValue(
        of({
          socketEvent: { type: "device-permission-requested", wording: "" },
          deviceIsLocked: false,
        })
      );
      const { result } = renderHook(() =>
        useGenuineCheck({
          getGenuineCheckFromDeviceId: mockedGetGenuineCheckFromDeviceId,
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
      mockedGetGenuineCheckFromDeviceId.mockReturnValue(
        of({
          socketEvent: { type: "device-permission-granted" },
          deviceIsLocked: false,
        })
      );
      const { result } = renderHook(() =>
        useGenuineCheck({
          getGenuineCheckFromDeviceId: mockedGetGenuineCheckFromDeviceId,
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
      mockedGetGenuineCheckFromDeviceId.mockReturnValue(
        throwError(new UserRefusedAllowManager())
      );
      const { result } = renderHook(() =>
        useGenuineCheck({
          getGenuineCheckFromDeviceId: mockedGetGenuineCheckFromDeviceId,
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
      mockedGetGenuineCheckFromDeviceId.mockReturnValue(
        throwError(new DisconnectedDeviceDuringOperation())
      );
      const { result } = renderHook(() =>
        useGenuineCheck({
          getGenuineCheckFromDeviceId: mockedGetGenuineCheckFromDeviceId,
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
        mockedGetGenuineCheckFromDeviceId.mockReturnValue(
          of({
            socketEvent: { type: "result", payload: "0000" },
            deviceIsLocked: false,
          })
        );
        const { result } = renderHook(() =>
          useGenuineCheck({
            getGenuineCheckFromDeviceId: mockedGetGenuineCheckFromDeviceId,
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
        mockedGetGenuineCheckFromDeviceId.mockReturnValue(
          of({
            socketEvent: { type: "result", payload: "1111" },
            deviceIsLocked: false,
          })
        );
        const { result } = renderHook(() =>
          useGenuineCheck({
            getGenuineCheckFromDeviceId: mockedGetGenuineCheckFromDeviceId,
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
      mockedGetGenuineCheckFromDeviceId.mockReturnValue(
        of(
          {
            socketEvent: { type: "device-permission-granted" },
            deviceIsLocked: false,
          },
          {
            socketEvent: { type: "result", payload: "1111" },
            deviceIsLocked: false,
          }
        )
      );

      const { result } = renderHook(() =>
        useGenuineCheck({
          getGenuineCheckFromDeviceId: mockedGetGenuineCheckFromDeviceId,
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
    it("should notify the hook consumer of the need to unlock the device", async () => {
      mockedGetGenuineCheckFromDeviceId.mockReturnValue(
        of({
          socketEvent: null,
          deviceIsLocked: true,
        })
      );

      const { result } = renderHook(() =>
        useGenuineCheck({
          getGenuineCheckFromDeviceId: mockedGetGenuineCheckFromDeviceId,
          deviceId: "A_DEVICE_ID",
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.devicePermissionState).toEqual("unlock-needed");
      expect(result.current.genuineState).toEqual("unchecked");
      expect(result.current.error).toBeNull();
    });
  });
});
