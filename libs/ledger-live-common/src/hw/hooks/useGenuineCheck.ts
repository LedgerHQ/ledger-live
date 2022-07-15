import { useCallback, useEffect, useState } from "react";
import { from, of } from "rxjs";
import { delay, mergeMap } from "rxjs/operators";
import { UserRefusedAllowManager } from "@ledgerhq/errors";
import type { SocketEvent, DeviceId } from "@ledgerhq/types-live";
import getDeviceInfo from "../getDeviceInfo";
import { withDevice } from "../deviceAccess";
import genuineCheck from "../genuineCheck";

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
  isHookEnabled = true,
  deviceId,
  lockedDeviceTimeoutMs = 1000,
}: UseGenuineCheckArgs): UseGenuineCheckResult => {
  const [genuineState, setGenuineState] = useState<GenuineState>("unchecked");
  const [devicePermissionState, setDevicePermisionState] =
    useState<DevicePermissionState>("unrequested");
  const [error, setError] = useState<Error | null>(null);

  const resetGenuineCheckState = useCallback(() => {
    setDevicePermisionState("unrequested");
    setGenuineState("unchecked");
  }, []);

  useEffect(() => {
    if (isHookEnabled) {
      // Notifies the hook consumer once the device is considered unresponsive.
      // As we're not timing out inside the genuineCheckObservable flow (with rxjs timeout for ex)
      // once the device is unlock, getDeviceInfo should return the device info and
      // the flow will continue. No need to handle a retry strategy
      const lockedDeviceTimeout = setTimeout(() => {
        setDevicePermisionState("unlock-needed");
      }, lockedDeviceTimeoutMs);

      // withDevice handles the unsubscribing cleaning when leaving the useEffect
      const genuineCheckObservable = withDevice(deviceId)((t) =>
        from(getDeviceInfo(t)).pipe(
          mergeMap((deviceInfo) => {
            clearTimeout(lockedDeviceTimeout);
            setDevicePermisionState("unlocked");
            return genuineCheck(t, deviceInfo);
          })
        )
      );

      genuineCheckObservable.subscribe({
        next: (socketEvent: SocketEvent) => {
          switch (socketEvent.type) {
            case "device-permission-requested":
              setDevicePermisionState("requested");
              break;
            case "device-permission-granted":
              setDevicePermisionState("granted");
              break;
            case "result":
              if (socketEvent.payload === "0000") {
                setGenuineState("genuine");
              } else {
                setGenuineState("non-genuine");
              }
              break;
          }
        },
        error: (e: any) => {
          if (e instanceof UserRefusedAllowManager) {
            setDevicePermisionState("refused");
          } else if (e instanceof Error) {
            // Probably an error of type DisconnectedDeviceDuringOperation or something else
            setError(e);
          } else {
            setError(new Error(`Unknown error: ${e}`));
          }
        },
      });
    }
  }, [isHookEnabled, deviceId, lockedDeviceTimeoutMs]);

  return {
    genuineState,
    devicePermissionState,
    error,
    resetGenuineCheckState,
  };
};
