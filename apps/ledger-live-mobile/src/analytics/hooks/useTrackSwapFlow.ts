import { useEffect, useRef } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { UserRefusedAllowManager, UserRefusedOnDevice } from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackSwapFlow = {
  location: HOOKS_TRACKING_LOCATIONS.swapFlow | undefined;
  requestOpenApp: string | null | undefined;
  device: Device;
  error: LedgerError | undefined | null;
};

/**
 * a custom hook to track events in the swap flow.
 * tracks user interactions within the swap flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Swap Flow" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param requestOpenApp - which app if any has been requested to be opened.
 * @param error - current error state.
 */
export const useTrackSwapFlow = ({
  location,
  device,
  error,
  requestOpenApp = undefined,
}: UseTrackSwapFlow) => {
  const previousRequestOpenApp = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.swapFlow) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Ledger Sync",
    };

    if (error instanceof UserRefusedAllowManager) {
      // user refused secured channel
      track("Secure Channel refused", defaultPayload);
    }

    if (previousRequestOpenApp.current && !requestOpenApp && error instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload);
    } else if (previousRequestOpenApp.current && !requestOpenApp && !error) {
      // user opened app
      track("Open app accepted", defaultPayload);
    }

    previousRequestOpenApp.current = requestOpenApp;
  }, [error, location, device, requestOpenApp]);
};
