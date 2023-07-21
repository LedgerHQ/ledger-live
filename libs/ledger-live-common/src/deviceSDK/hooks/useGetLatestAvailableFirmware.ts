import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import {
  GetLatestAvailableFirmwareActionState,
  getLatestAvailableFirmwareAction as defaultGetLatestAvailableFirmwareAction,
  initialState,
} from "../actions/getLatestAvailableFirmware";

export type UseGetLatestAvailableFirmwareArgs = {
  getLatestAvailableFirmwareAction?: typeof defaultGetLatestAvailableFirmwareAction;
  deviceId: string;
  isHookEnabled?: boolean;
};

/**
 * Hook to get the latest available firmware that the device could update to
 *
 * @param `deviceId` A device id, or an empty string if device is usb plugged
 * @param isHookEnabled A boolean to enable (true, default value) or disable (false) the hook
 * @returns an object containing the state of the process to get the latest available firmware.
 *  The state is as follow (+ shared state with other actions):
 * - `firmwareUpdateContext`: the `FirmwareUpdateContext` when retrieved, null otherwise
 * - `deviceInfo`: the `DeviceInfo` when retrieved, null otherwise
 * - `status`: the current status of the action: "error" | "no-available-firmware" | "available-firmware" meaning the action has finished
 * - `error`: an error coming from the business logic, the device or internal. Some error are retried:
 *   `{ type`: "SharedError", retrying: true, ... }`
 * - `...sharedActionState`
 */
export const useGetLatestAvailableFirmware = ({
  getLatestAvailableFirmwareAction = defaultGetLatestAvailableFirmwareAction,
  deviceId,
  isHookEnabled = true,
}: UseGetLatestAvailableFirmwareArgs): {
  state: GetLatestAvailableFirmwareActionState;
} => {
  const [state, setState] = useState<GetLatestAvailableFirmwareActionState>(initialState);

  useEffect(() => {
    if (!isHookEnabled) {
      return;
    }

    // Resets the resulting state on each new triggering
    // (not on clean up, to keep the last state when `isHookEnabled === false`)
    setState(initialState);

    const subscription = getLatestAvailableFirmwareAction({
      deviceId,
    }).subscribe({
      next: setState,
      error: (error: unknown) => {
        // Error from an action should be handled like an event and should not reach here
        log("useGetLatestAvailableFirmware", "Unknown error", error);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId, getLatestAvailableFirmwareAction, isHookEnabled]);

  return { state };
};
