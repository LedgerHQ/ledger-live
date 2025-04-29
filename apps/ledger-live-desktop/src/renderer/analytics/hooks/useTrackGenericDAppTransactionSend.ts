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

export type UseTrackGenericDAppTransactionSend = {
  location: HOOKS_TRACKING_LOCATIONS.genericDAppTransactionSend | undefined;
  device: Device;
  allowManagerRequested: boolean | null | undefined;
  error?:
    | (LedgerError & {
        name?: string;
        managerAppName?: string;
      })
    | undefined
    | null;
  isTrackingEnabled: boolean;
  requestOpenApp: string | null | undefined;
  openedAppName: string | null | undefined;
  isLocked: boolean | null | undefined;
  inWrongDeviceForAccount:
    | {
        accountName: string;
      }
    | null
    | undefined;
};

/**
 * a custom hook to track events in generic DApp transaction flow (send).
 * tracks user interactions with generic DApp transaction flow (send) based on state changes and errors.
 *
 * @param location - current location in the app (expected "Ledger Sync" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param error - optional - current error state.
 * @param allowManagerRequested - flag indicating if the user has allowed the Manager app.
 * @param requestOpenApp - the app requested to be opened.
 * @param openedAppName - the currently opened app name.
 * @param isLocked - flag indicating if the device is locked.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 * @param inWrongDeviceForAccount - error from verifying address.
 */
export const useTrackGenericDAppTransactionSend = ({
  location,
  device,
  error = null,
  allowManagerRequested,
  requestOpenApp,
  openedAppName,
  isTrackingEnabled,
  isLocked,
  inWrongDeviceForAccount,
}: UseTrackGenericDAppTransactionSend) => {
  const previousAllowManagerRequested = useRef<boolean | null | undefined>(undefined);
  const previousOpenAppRequested = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.genericDAppTransactionSend) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLD",
      page: "Generic DApp Transaction Send",
    };

    if (
      previousAllowManagerRequested.current === true &&
      allowManagerRequested === false &&
      !error
    ) {
      // user accepted secure channel
      track("Secure Channel approved", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof UserRefusedAllowManager) {
      // user refused secure channel
      track("Secure Channel refused", defaultPayload, isTrackingEnabled);
    }

    if (inWrongDeviceForAccount) {
      // device used is not associated with the account
      track("Wrong device association", defaultPayload, isTrackingEnabled);
    }

    if (openedAppName && previousOpenAppRequested.current.has(openedAppName)) {
      // Check if the opened app name is in the set of requested apps.
      track("User opened app", defaultPayload, isTrackingEnabled);
      // Clear the set after tracking the event.
      previousOpenAppRequested.current.clear();
    }

    if (previousOpenAppRequested.current.size && error instanceof UserRefusedOnDevice) {
      // user refused to open add during generic DApp transaction flow (send)
      track("User refused to open app", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof CantOpenDevice) {
      // device disconnected during generic DApp transaction flow (send)
      track("Connection failed", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof TransportError) {
      // transport error during generic DApp transaction flow (send)
      track("Transport error", defaultPayload, isTrackingEnabled);
    }

    if (isLocked || error instanceof LockedDeviceError) {
      // device locked during generic DApp transaction flow (send)
      track("Device locked", defaultPayload, isTrackingEnabled);
    }

    // When requestOpenApp is present, add it to our Set.
    if (requestOpenApp) {
      previousOpenAppRequested.current.add(requestOpenApp);
    }

    previousAllowManagerRequested.current = allowManagerRequested;
  }, [
    error,
    location,
    isTrackingEnabled,
    device,
    allowManagerRequested,
    requestOpenApp,
    openedAppName,
    isLocked,
    inWrongDeviceForAccount,
  ]);
};
