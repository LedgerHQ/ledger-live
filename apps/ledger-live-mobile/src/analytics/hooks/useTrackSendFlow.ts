import { useEffect, useRef } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import {
  UserRefusedOnDevice,
  TransportRaceCondition,
  LockedDeviceError,
  CantOpenDevice,
  TransportError,
} from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackSendFlow = {
  location: HOOKS_TRACKING_LOCATIONS.sendFlow | undefined;
  device: Device;
  requestOpenApp?: string | null;
  error: LedgerError | undefined | null;
  isLocked: boolean | null | undefined;
};

/**
 * a custom hook to track events in the Send flow.
 * tracks user interactions with in the Send flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Send Modal" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param requestOpenApp - optional - which app if any has been requested to be opened.
 * @param inWrongDeviceForAccount - optional - indicating if the user is in the wrong device for the account.
 * @param isLocked - flag indicating if the device is locked.
 * @param error - current error state.
 */
export const useTrackSendFlow = ({
  location,
  device,
  requestOpenApp,
  error,
  isLocked,
}: UseTrackSendFlow) => {
  const previousRequestOpenApp = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.sendFlow) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Send",
    };

    if (previousRequestOpenApp.current && !requestOpenApp && error instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload);
    } else if (previousRequestOpenApp.current && !requestOpenApp && !error) {
      // user opened app
      track("Open app accepted", defaultPayload);
    }

    if (error instanceof TransportRaceCondition) {
      // transport race condition
      track("Transport race condition", defaultPayload);
    }

    if (error instanceof CantOpenDevice) {
      // device disconnected during send flow
      track("Connection failed", defaultPayload);
    }

    if (error instanceof TransportError) {
      // transport error during send flow
      track("Transport error", defaultPayload);
    }

    if (isLocked || error instanceof LockedDeviceError) {
      // device locked during send flow
      track("Device locked", defaultPayload);
    }

    previousRequestOpenApp.current = requestOpenApp;
  }, [error, location, device, requestOpenApp, isLocked]);
};
