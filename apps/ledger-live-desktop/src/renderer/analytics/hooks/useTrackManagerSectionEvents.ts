import { useRef, useEffect } from "react";
import {
  UserRefusedAllowManager,
  UserRefusedDeviceNameChange,
  UserRefusedFirmwareUpdate,
} from "@ledgerhq/errors";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { LedgerError } from "~/renderer/components/DeviceAction";

export type UseTrackManagerSectionEvents = {
  location: HOOKS_TRACKING_LOCATIONS.managerDashboard | undefined;
  device: Device;
  allowManagerRequested: boolean | null | undefined;
  error:
    | (LedgerError & {
        name?: string;
        managerAppName?: string;
      })
    | undefined
    | null;
  clsImageRemoved: boolean | null | undefined;
  isTrackingEnabled: boolean;
};

/**
 * a custom hook to track events in the Manager section.
 * tracks user interactions with the Manager dashboard based on state changes and errors.
 *
 * @param location - current location in the app (expected "Manager Dashboard" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param allowManagerRequested - flag indicating if the user has allowed the Manager app.
 * @param clsImageRemoved - flag indicating if the user has removed the custom lock screen image.
 * @param error - current error state.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 */
export const useTrackManagerSectionEvents = ({
  location,
  device,
  allowManagerRequested,
  clsImageRemoved,
  error,
  isTrackingEnabled,
}: UseTrackManagerSectionEvents) => {
  const previousAllowManagerRequested = useRef<boolean | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.managerDashboard) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLD",
      page: "Manager Dashboard",
    };

    if (
      previousAllowManagerRequested.current === true &&
      allowManagerRequested === false &&
      !error
    ) {
      // user accepted secure channel
      track("Secure Channel approved", defaultPayload, isTrackingEnabled);
    }

    if (clsImageRemoved) {
      // user removed CLS image
      track("Deleted Custom Lock Screen", defaultPayload, isTrackingEnabled);
    }

    if ((error as unknown) instanceof UserRefusedAllowManager) {
      // user refused secure channel
      track("Secure Channel denied", defaultPayload, isTrackingEnabled);
    } else if ((error as unknown) instanceof UserRefusedDeviceNameChange) {
      // user refused device name change
      track("Renamed Device cancelled", defaultPayload, isTrackingEnabled);
    } else if ((error as unknown) instanceof UserRefusedFirmwareUpdate) {
      // user refused OS update
      track("User refused OS update via LL", defaultPayload, isTrackingEnabled);
    }

    previousAllowManagerRequested.current = allowManagerRequested;
  }, [allowManagerRequested, error, location, isTrackingEnabled, device, clsImageRemoved]);
};
