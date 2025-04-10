import { useEffect } from "react";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { LedgerError } from "~/renderer/components/DeviceAction";

export type UseTrackSendFlow = {
  location: HOOKS_TRACKING_LOCATIONS.sendModal | undefined;
  device: Device;
  error:
    | (LedgerError & {
        name?: string;
        managerAppName?: string;
      })
    | undefined
    | null;
  inWrongDeviceForAccount:
    | {
        accountName: string;
      }
    | null
    | undefined;
  isTrackingEnabled: boolean;
};

/**
 * a custom hook to track events in the Send modal.
 * tracks user interactions with the Send modal based on state changes and errors.
 *
 * @param location - current location in the app (expected "Send Modal" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param error - current error state.
 * @param inWrongDeviceForAccount - error from verifying address.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 */
export const useTrackSendFlow = ({
  location,
  device,
  error,
  inWrongDeviceForAccount,
  isTrackingEnabled,
}: UseTrackSendFlow) => {
  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.sendModal) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLD",
      page: "Send",
    };

    if ((error as unknown) instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload, isTrackingEnabled);
    }
    if (inWrongDeviceForAccount) {
      // device used is not associated with the account
      track("Wrong device association", defaultPayload, isTrackingEnabled);
    }
  }, [error, location, isTrackingEnabled, device, inWrongDeviceForAccount]);
};
