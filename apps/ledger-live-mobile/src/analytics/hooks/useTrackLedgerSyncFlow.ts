import { useEffect, useRef } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import {
  CantOpenDevice,
  LockedDeviceError,
  TransportError,
  UserRefusedAllowManager,
  UserRefusedOnDevice,
} from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackLedgerSyncFlow = {
  location: HOOKS_TRACKING_LOCATIONS.ledgerSyncFlow | undefined;
  device: Device;
  allowManagerRequested: boolean | null | undefined;
  requestOpenApp: string | null | undefined;
  error: LedgerError | undefined | null;
  isLocked: boolean | null | undefined;
  inWrongDeviceForAccount:
    | {
        accountName: string;
      }
    | null
    | undefined;
};

/**
 * a custom hook to track events in the Ledger Sync flow.
 * tracks user interactions with in the Ledger Sync flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Ledger Sync" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param allowManagerRequested - flag indicating if the user has been requested secure connection.
 * @param requestOpenApp - which app if any has been requested to be opened.
 * @param isLocked - flag indicating if the device is locked.
 * @param inWrongDeviceForAccount - indicating if the user is in the wrong device for the account.
 * @param error - current error state.
 */
export const useTrackLedgerSyncFlow = ({
  location,
  device,
  allowManagerRequested,
  requestOpenApp,
  error,
  isLocked,
  inWrongDeviceForAccount,
}: UseTrackLedgerSyncFlow) => {
  const previousRequestOpenApp = useRef<string | null | undefined>(undefined);
  const previousAllowManagerRequested = useRef<boolean | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.ledgerSyncFlow) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Ledger Sync",
    };

    if (
      previousAllowManagerRequested.current === true &&
      allowManagerRequested === false &&
      !error
    ) {
      // user accepted secure channel
      track("Secure Channel approved", defaultPayload);
    }

    if (inWrongDeviceForAccount) {
      // user is in the wrong device for the account
      track("Wrong device association", defaultPayload);
    }

    if (previousRequestOpenApp.current && error instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload);
    } else if (previousRequestOpenApp.current && !requestOpenApp && !error) {
      // user opened app
      track("Open app accepted", defaultPayload);
    }

    if (error instanceof UserRefusedAllowManager) {
      // user refused secured channel
      track("Secure Channel refused", defaultPayload);
    }

    if (error instanceof CantOpenDevice) {
      // device disconnected during ledger synch
      track("Connection failed", defaultPayload);
    }

    if (error instanceof TransportError) {
      // transport error during ledger synch
      track("Transport error", defaultPayload);
    }

    if (isLocked || error instanceof LockedDeviceError) {
      // device locked during ledger synch
      track("Device locked", defaultPayload);
    }

    previousRequestOpenApp.current = requestOpenApp;
    previousAllowManagerRequested.current = allowManagerRequested;
  }, [
    error,
    location,
    device,
    requestOpenApp,
    allowManagerRequested,
    isLocked,
    inWrongDeviceForAccount,
  ]);
};
