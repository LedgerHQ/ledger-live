import { useEffect, useRef } from "react";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { LedgerErrorConstructor } from "@ledgerhq/errors/lib/helpers";
import {
  UserRefusedAllowManager,
  UserRefusedOnDevice,
  LockedDeviceError,
  CantOpenDevice,
  TransportError,
} from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

type LedgerError = InstanceType<LedgerErrorConstructor<{ [key: string]: unknown }>>;

export type UseTrackSyncFlow = {
  location: HOOKS_TRACKING_LOCATIONS.ledgerSync | undefined;
  device: Device;
  allowManagerRequested: boolean | null | undefined;
  error?:
    | (LedgerError & {
        name?: string;
        managerAppName?: string;
      })
    | undefined
    | null;
  isLedgerSyncAppOpen: boolean;
  isTrackingEnabled: boolean;
  requestOpenApp: string | null | undefined;
  isLocked: boolean | null | undefined;
  inWrongDeviceForAccount:
    | {
        accountName: string;
      }
    | null
    | undefined;
};

/**
 * a custom hook to track events in the Sync flow.
 * tracks user interactions with the Sync flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Ledger Sync" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param error - optional - current error state.
 * @param allowManagerRequested - flag indicating if the user has allowed the Manager app.
 * @param requestOpenApp - the app requested to be opened.
 * @param isLedgerSyncAppOpen - flag indicating if the Ledger Sync app is open.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 * @param isLocked - flag indicating if the device is locked.
 * @param inWrongDeviceForAccount - error from verifying address.
 */
export const useTrackSyncFlow = ({
  location,
  device,
  error = null,
  allowManagerRequested,
  requestOpenApp,
  isLedgerSyncAppOpen,
  isTrackingEnabled,
  isLocked,
  inWrongDeviceForAccount,
}: UseTrackSyncFlow) => {
  const previousAllowManagerRequested = useRef<boolean | null | undefined>(undefined);
  const previousOpenAppRequested = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.ledgerSync) return;
    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLD",
      page: "Receive",
    };

    if (
      previousAllowManagerRequested.current === true &&
      allowManagerRequested === false &&
      !error
    ) {
      // user accepted secure channel
      track("Secure Channel approved", defaultPayload, isTrackingEnabled);
    }

    if (inWrongDeviceForAccount) {
      // device used is not associated with the account
      track("Wrong device association", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof UserRefusedAllowManager) {
      // user refused secure channel
      track("Secure Channel refused", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof CantOpenDevice) {
      // device disconnected during ledger synch
      track("Connection failed", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof TransportError) {
      // transport error during ledger synch
      track("Transport error", defaultPayload, isTrackingEnabled);
    }

    if (isLocked || error instanceof LockedDeviceError) {
      // device locked during ledger synch
      track("Device locked", defaultPayload, isTrackingEnabled);
    }

    if (previousOpenAppRequested && error instanceof UserRefusedOnDevice) {
      // user refused to open Ledger Sync app
      track("User refused to open Ledger Sync app", defaultPayload, isTrackingEnabled);
    }

    if (previousOpenAppRequested && isLedgerSyncAppOpen) {
      // user opened Ledger Sync app
      track("User opened Ledger Sync app", defaultPayload, isTrackingEnabled);
    }

    previousAllowManagerRequested.current = allowManagerRequested;
    previousOpenAppRequested.current = requestOpenApp;
  }, [
    error,
    location,
    isTrackingEnabled,
    device,
    allowManagerRequested,
    requestOpenApp,
    isLedgerSyncAppOpen,
    isLocked,
    inWrongDeviceForAccount,
  ]);
};
