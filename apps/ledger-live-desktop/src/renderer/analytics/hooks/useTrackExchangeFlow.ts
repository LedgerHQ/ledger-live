import { useRef, useEffect } from "react";
import { UserRefusedAllowManager, UserRefusedOnDevice } from "@ledgerhq/errors";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { LedgerError } from "~/renderer/components/DeviceAction";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

export type UseTrackExchangeFlow = {
  location: HOOKS_TRACKING_LOCATIONS.exchange | undefined;
  device: Device;
  error:
    | (LedgerError & {
        name?: string;
        managerAppName?: string;
      })
    | undefined
    | null;
  isTrackingEnabled: boolean;
  isRequestOpenAppExchange: boolean | null;
};

/**
 * a custom hook to track events in the Exchange flow.
 * tracks user interactions in the Exchange flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Exchange" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param error - current error state.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 * @param isRequestOpenAppExchange - flag indicating if LLD requested to open the exchange app.
 */
export const useTrackExchangeFlow = ({
  location,
  device,
  error,
  isTrackingEnabled,
  isRequestOpenAppExchange,
}: UseTrackExchangeFlow) => {
  const previousIsRequestOpenAppExchange = useRef<boolean | null>(null);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.exchange) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLD",
      page: "Exchange",
    };

    if ((error as unknown) instanceof UserRefusedOnDevice) {
      // user refused to open exchange app
      track("Open app denied", defaultPayload, isTrackingEnabled);
    } else if ((error as unknown) instanceof UserRefusedAllowManager) {
      // user refused secure channel
      track("Secure Channel denied", defaultPayload, isTrackingEnabled);
    }

    if (previousIsRequestOpenAppExchange.current === true && isRequestOpenAppExchange === false) {
      // user opened exchange app
      track("Open app performed", defaultPayload, isTrackingEnabled);
    }

    previousIsRequestOpenAppExchange.current = isRequestOpenAppExchange;
  }, [error, location, isTrackingEnabled, device, isRequestOpenAppExchange]);
};
