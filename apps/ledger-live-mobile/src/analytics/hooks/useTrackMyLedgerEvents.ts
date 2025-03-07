import { useEffect, useRef } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { UserRefusedAllowManager, UserRefusedDeviceNameChange } from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackMyLedgerSectionEvents = {
  location: HOOKS_TRACKING_LOCATIONS.myLedgerDashboard | undefined;
  device: Device;
  allowManagerRequested: boolean | null | undefined;
  allowRenamingRequested: boolean | null | undefined;
  imageRemoveRequested: boolean | null | undefined;
  error: LedgerError | undefined | null;
};

/**
 * a custom hook to track events in the My Ledger section.
 * tracks user interactions with the My Ledger dashboard based on state changes and errors.
 *
 * @param location - current location in the app (expected "My Ledger Dashboard" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param allowManagerRequested - flag indicating if the user has been requested secure connection.
 * @param allowRenamingRequested - flag indicating if the user has been requested to rename the device.
 * @param imageRemoveRequested - flag indicating if the user has requested to remove the custom lock screen image.
 * @param error - current error state.
 */
export const useTrackMyLedgerSectionEvents = ({
  location,
  device,
  allowManagerRequested,
  allowRenamingRequested,
  imageRemoveRequested,
  error,
}: UseTrackMyLedgerSectionEvents) => {
  const previousAllowManagerRequested = useRef<boolean | null | undefined>(undefined);
  const previousAllowRenamingRequested = useRef<boolean | null | undefined>(undefined);
  const previousImageRemoveRequested = useRef<boolean | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.myLedgerDashboard) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Manager Dashboard",
    };

    if (
      previousAllowManagerRequested.current === true &&
      allowManagerRequested === false &&
      !error
    ) {
      // user accepted secure channel
      track("Secure Channel approved", defaultPayload);
    }

    if (
      previousAllowRenamingRequested.current === true &&
      allowRenamingRequested === false &&
      !error
    ) {
      // user accepted device renaming
      track("Renamed Device entered", { ...defaultPayload, page: "Manager RenamedDevice" });
    }

    if (previousImageRemoveRequested.current === true && imageRemoveRequested === false && !error) {
      // user removed the custom lock screen image
      track("Custom Lock Screen Image removed", defaultPayload);
    }

    if ((error as unknown) instanceof UserRefusedAllowManager) {
      // user refused secure channel
      track("Secure Channel denied", defaultPayload);
    } else if ((error as unknown) instanceof UserRefusedDeviceNameChange) {
      // user refused device name change
      track("Renamed Device cancelled", { ...defaultPayload, page: "Manager RenamedDevice" });
    }

    previousAllowManagerRequested.current = allowManagerRequested;
    previousAllowRenamingRequested.current = allowRenamingRequested;
    previousImageRemoveRequested.current = imageRemoveRequested;
  }, [
    error,
    location,
    device,
    allowManagerRequested,
    allowRenamingRequested,
    imageRemoveRequested,
  ]);
};
