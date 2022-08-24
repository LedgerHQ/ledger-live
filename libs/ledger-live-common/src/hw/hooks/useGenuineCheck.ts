import { useCallback, useEffect, useState } from "react";
import { UserRefusedAllowManager } from "@ledgerhq/errors";
import type { DeviceId } from "@ledgerhq/types-live";
import { getGenuineCheckFromDeviceId as defaultGetGenuineCheckFromDeviceId } from "../getGenuineCheckFromDeviceId";
import type {
  GetGenuineCheckFromDeviceIdArgs,
  GetGenuineCheckFromDeviceIdResult,
  GetGenuineCheckFromDeviceIdOutput,
} from "../getGenuineCheckFromDeviceId";

export type GenuineState = "unchecked" | "genuine" | "non-genuine";
export type DevicePermissionState =
  | "unrequested"
  | "unlock-needed"
  | "unlocked"
  | "requested"
  | "granted"
  | "refused";

export type UseGenuineCheckArgs = {
  isHookEnabled?: boolean;
  deviceId: DeviceId;
  lockedDeviceTimeoutMs?: number;
};

export type UseGenuineCheckDependencies = {
  getGenuineCheckFromDeviceId?: (
    args: GetGenuineCheckFromDeviceIdArgs
  ) => GetGenuineCheckFromDeviceIdOutput;
};

export type UseGenuineCheckResult = {
  genuineState: GenuineState;
  devicePermissionState: DevicePermissionState;
  error: Error | null;
  resetGenuineCheckState: () => void;
};

/**
 * Hook to check that a device is genuine
 * It replaces a DeviceAction if we're only interested in getting the genuine check
 * @param isHookEnabled A boolean to enable (true, default value) or disable (false) the hook
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @param lockedDeviceTimeoutMs Time of no response from device after which the device is considered locked, in ms. Default 1000ms.
 * @returns An object containing:
 * - genuineState: the current GenuineState
 * - devicePermissionState: the current DevicePermissionState
 * - error: any error that occurred during the genuine check, or null
 */
export const useGenuineCheck = ({
  getGenuineCheckFromDeviceId = defaultGetGenuineCheckFromDeviceId,
  isHookEnabled = true,
  deviceId,
  lockedDeviceTimeoutMs = 1000,
}: UseGenuineCheckArgs &
  UseGenuineCheckDependencies): UseGenuineCheckResult => {
  const [genuineState, setGenuineState] = useState<GenuineState>("unchecked");
  const [devicePermissionState, setDevicePermissionState] =
    useState<DevicePermissionState>("unrequested");
  const [error, setError] = useState<Error | null>(null);

  const resetGenuineCheckState = useCallback(() => {
    setDevicePermissionState("unrequested");
    setGenuineState("unchecked");
  }, []);

  useEffect(() => {
    if (isHookEnabled) {
      getGenuineCheckFromDeviceId({
        deviceId,
        lockedDeviceTimeoutMs,
      }).subscribe({
        next: ({
          socketEvent,
          deviceIsLocked,
        }: GetGenuineCheckFromDeviceIdResult) => {
          if (socketEvent) {
            switch (socketEvent.type) {
              case "device-permission-requested":
                setDevicePermissionState("requested");
                break;
              case "device-permission-granted":
                setDevicePermissionState("granted");
                break;
              case "result":
                if (socketEvent.payload === "0000") {
                  setGenuineState("genuine");
                } else {
                  setGenuineState("non-genuine");
                }
                break;
            }
          } else {
            // If no socketEvent, the device is locked or has been unlocked
            if (deviceIsLocked) {
              setDevicePermissionState("unlock-needed");
            } else {
              setDevicePermissionState("unlocked");
            }
          }
        },
        error: (e: any) => {
          if (e instanceof UserRefusedAllowManager) {
            setDevicePermissionState("refused");
          } else if (e instanceof Error) {
            // Probably an error of type DisconnectedDeviceDuringOperation or something else
            setError(e);
          } else {
            setError(new Error(`Unknown error: ${e}`));
          }
        },
      });
    }
  }, [
    isHookEnabled,
    deviceId,
    lockedDeviceTimeoutMs,
    getGenuineCheckFromDeviceId,
  ]);

  return {
    genuineState,
    devicePermissionState,
    error,
    resetGenuineCheckState,
  };
};
