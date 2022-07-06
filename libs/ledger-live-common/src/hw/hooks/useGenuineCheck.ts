import { useEffect, useState } from "react";
import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { UserRefusedAllowManager } from "@ledgerhq/errors";
import getDeviceInfo from "../getDeviceInfo";
import { withDevice } from "../deviceAccess";
import { DeviceId } from "../../types";
import { SocketEvent } from "../../types/manager";
import genuineCheck from "../genuineCheck";

export type GenuineState = "unchecked" | "genuine" | "non-genuine";
export type DevicePermissionState =
  | "unrequested"
  | "requested"
  | "granted"
  | "refused";

export type UseGenuineCheckArgs = {
  isHookEnabled?: boolean;
  deviceId: DeviceId;
};

export type UseGenuineCheckResult = {
  genuineState: GenuineState;
  devicePermissionState: DevicePermissionState;
  error: Error | null;
};

/**
 * Hook to check that a device is genuine
 * It replaces a DeviceAction if we're only interested in getting the genuine check
 * @param isHookEnabled A boolean to enable (true, default value) or disable (false) the hook
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @returns An object containing:
 * - genuineState: the current GenuineState
 * - devicePermissionState: the current DevicePermissionState
 * - error: any error that occurred during the genuine check, or null
 */
export const useGenuineCheck = ({
  isHookEnabled = true,
  deviceId,
}: UseGenuineCheckArgs): UseGenuineCheckResult => {
  const [genuineState, setGenuineState] = useState<GenuineState>("unchecked");
  const [devicePermissionState, setDevicePermisionState] =
    useState<DevicePermissionState>("unrequested");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isHookEnabled) {
      // withDevice handles the unsubscribing cleaning when leaving the useEffect
      const genuineCheckObservable = withDevice(deviceId)((t) =>
        from(getDeviceInfo(t)).pipe(
          mergeMap((deviceInfo) => genuineCheck(t, deviceInfo))
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
  }, [isHookEnabled, deviceId]);

  return {
    genuineState,
    devicePermissionState,
    error,
  };
};
