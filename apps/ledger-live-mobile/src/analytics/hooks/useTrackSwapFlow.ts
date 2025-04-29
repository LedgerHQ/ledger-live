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
  TransportRaceCondition,
} from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackSwapFlow = {
  location: HOOKS_TRACKING_LOCATIONS.swapFlow | undefined;
  requestOpenApp: string | null | undefined;
  device: Device;
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
 * a custom hook to track events in the swap flow.
 * tracks user interactions within the swap flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Swap Flow" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param requestOpenApp - which app if any has been requested to be opened.
 * @param isLocked - flag indicating if the device is locked.
 * @param inWrongDeviceForAccount - indicating if the user is in the wrong device for the account.
 * @param error - current error state.
 */
export const useTrackSwapFlow = ({
  location,
  device,
  error,
  isLocked,
  inWrongDeviceForAccount,
  requestOpenApp = undefined,
}: UseTrackSwapFlow) => {
  const previousRequestOpenApp = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.swapFlow) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Exchange",
    };

    if (inWrongDeviceForAccount) {
      // user is in the wrong device for the account
      track("Wrong device association", defaultPayload);
    }

    if (error instanceof UserRefusedAllowManager) {
      // user refused secured channel
      track("Secure Channel refused", defaultPayload);
    }

    if (error instanceof CantOpenDevice) {
      // device disconnected during swap flow
      track("Connection failed", defaultPayload);
    }

    if (error instanceof TransportError) {
      // transport error during swap flow
      track("Transport error", defaultPayload);
    }

    if (error instanceof TransportRaceCondition) {
      // transport race condition
      track("Transport race condition", defaultPayload);
    }

    if (isLocked || error instanceof LockedDeviceError) {
      // device locked during swap flow
      track("Device locked", defaultPayload);
    }

    if (previousRequestOpenApp.current && !requestOpenApp && error instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload);
    } else if (previousRequestOpenApp.current && !requestOpenApp && !error) {
      // user opened app
      track("Open app accepted", defaultPayload);
    }

    previousRequestOpenApp.current = requestOpenApp;
  }, [error, location, device, requestOpenApp, isLocked, inWrongDeviceForAccount]);
};
