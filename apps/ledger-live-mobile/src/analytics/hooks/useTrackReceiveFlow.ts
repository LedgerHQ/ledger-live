import { useEffect, useRef } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { UserRefusedAddress, UserRefusedOnDevice } from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackReceiveFlow = {
  location: HOOKS_TRACKING_LOCATIONS.receiveFlow | undefined;
  device: Device;
  requestOpenApp?: string | null | undefined;
  inWrongDeviceForAccount?:
    | {
        accountName: string;
      }
    | null
    | undefined;
  error: LedgerError | undefined | null;
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
 */
export const useTrackReceiveFlow = ({
  location,
  device,
  requestOpenApp,
  inWrongDeviceForAccount,
  error,
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
    } else if (error instanceof UserRefusedAddress) {
      // user refused to verify address
      track("Address confirmation rejected", defaultPayload);
    }

    previousRequestOpenApp.current = requestOpenApp;
  }, [error, location, device, requestOpenApp, inWrongDeviceForAccount]);
};
