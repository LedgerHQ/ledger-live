import { useEffect, useRef } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import {
  UserRefusedAddress,
  UserRefusedOnDevice,
  TransportRaceCondition,
  LockedDeviceError,
  CantOpenDevice,
  TransportError,
} from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackReceiveFlow = {
  location: HOOKS_TRACKING_LOCATIONS.receiveFlow | undefined;
  device: Device;
  requestOpenApp?: string | null;
  inWrongDeviceForAccount?: {
    accountName: string;
  } | null;
  error: LedgerError | undefined | null;
  isLocked?: boolean | null | undefined;
};

/**
 * a custom hook to track events in the Receive flow.
 * tracks user interactions with in the Receive flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Receive Modal" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param requestOpenApp - optional - which app if any has been requested to be opened.
 * @param inWrongDeviceForAccount - optional - indicating if the user is in the wrong device for the account.
 * @param error - current error state.
 * @param isLocked - optional - flag indicating if the device is locked.
 */
export const useTrackReceiveFlow = ({
  location,
  device,
  requestOpenApp,
  inWrongDeviceForAccount,
  error,
  isLocked,
}: UseTrackReceiveFlow) => {
  const previousRequestOpenApp = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.receiveFlow) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Receive",
    };

    if (inWrongDeviceForAccount) {
      // user is in the wrong device for the account
      track("Wrong device association", defaultPayload);
    }

    if (previousRequestOpenApp.current && !requestOpenApp && error instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload);
    }

    if (error instanceof UserRefusedAddress) {
      // user refused to verify address
      track("Address confirmation rejected", defaultPayload);
    }

    if (error instanceof TransportRaceCondition) {
      // transport race condition
      track("Transport race condition", defaultPayload);
    }

    if (error instanceof CantOpenDevice) {
      // device disconnected during receive flow
      track("Connection failed", defaultPayload);
    }

    if (error instanceof TransportError) {
      // transport error during receive flow
      track("Transport error", defaultPayload);
    }

    if (isLocked || error instanceof LockedDeviceError) {
      // device locked during receive flow
      track("Device locked", defaultPayload);
    }

    previousRequestOpenApp.current = requestOpenApp;
  }, [error, location, device, requestOpenApp, inWrongDeviceForAccount, isLocked]);
};
