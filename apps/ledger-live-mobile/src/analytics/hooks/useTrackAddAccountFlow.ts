import { useEffect, useRef } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { CantOpenDevice, LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackAddAccountFlow = {
  location: HOOKS_TRACKING_LOCATIONS.addAccount | undefined;
  device: Device;
  requestOpenApp?: string | null;
  allowOpeningGranted?: boolean | null;
  isScanningForNewAccounts?: boolean | null;
  error: LedgerError | undefined | null;
};

/**
 * a custom hook to track events in the AddAccount flow.
 * tracks user interactions with in the AddAccount flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Add Account" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param requestOpenApp - optional - which app if any has been requested to be opened.
 * @param allowOpeningGranted - optional - indicating if the user has granted permission to open the app.
 * @param isScanningForNewAccounts - optional - indicating if the app is scanning for new accounts.
 * @param error - current error state.
 */
export const useTrackAddAccountFlow = ({
  location,
  device,
  requestOpenApp,
  allowOpeningGranted,
  isScanningForNewAccounts,
  error,
}: UseTrackAddAccountFlow) => {
  const previousRequestOpenApp = useRef<string | null | undefined>(undefined);
  const previousAllowOpeningGranted = useRef<boolean | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.addAccount) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Add account",
    };

    if (previousRequestOpenApp.current && !requestOpenApp && error instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload);
    }

    if (
      previousAllowOpeningGranted.current &&
      !allowOpeningGranted &&
      error instanceof CantOpenDevice
    ) {
      // user lost connection after opening app
      track("Device connection lost", defaultPayload);
      previousAllowOpeningGranted.current = undefined;
    }

    if (previousAllowOpeningGranted.current && error instanceof LockedDeviceError) {
      // device is locked while scanning for new accounts
      track("Device locked", defaultPayload);
      previousAllowOpeningGranted.current = undefined;
    }

    if (isScanningForNewAccounts && error instanceof CantOpenDevice) {
      // user lost connection while scanning for new accounts
      track("Device connection lost", defaultPayload);
    } else if (error instanceof CantOpenDevice) {
      // device is detected but connection failed
      track("Connection failed", defaultPayload);
    }

    if (allowOpeningGranted) {
      // too many re-renders, this has to be reset once consumed as true
      previousAllowOpeningGranted.current = allowOpeningGranted;
    }

    previousRequestOpenApp.current = requestOpenApp;
  }, [error, location, device, requestOpenApp, allowOpeningGranted, isScanningForNewAccounts]);
};
