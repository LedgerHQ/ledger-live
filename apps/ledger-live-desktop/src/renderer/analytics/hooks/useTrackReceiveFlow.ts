import { useEffect } from "react";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { LedgerError } from "~/renderer/components/DeviceAction";

export type UseTrackReceiveFlow = {
  location: string | undefined;
  device: Device;
  verifyAddressError?:
    | {
        name: string;
      }
    | null
    | undefined;
  error?:
    | (LedgerError & {
        name?: string;
        managerAppName?: string;
      })
    | undefined
    | null;
  inWrongDeviceForAccount?:
    | {
        accountName: string;
      }
    | null
    | undefined;
  isTrackingEnabled: boolean;
};

/**
 * a custom hook to track events in the Receive modal.
 * tracks user interactions with the Receive modal based on state changes and errors.
 *
 * @param location - current location in the app (expected "Receive Modal").
 * @param device - the connected device information.
 * @param verifyAddressError - optional - error from verifying address.
 * @param error - optional - current error state.
 * @param inWrongDeviceForAccount - optional - error from verifying address.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 */
export const useTrackReceiveFlow = ({
  location,
  device,
  verifyAddressError = null,
  error = null,
  inWrongDeviceForAccount = null,
  isTrackingEnabled,
}: UseTrackReceiveFlow) => {
  useEffect(() => {
    if (location !== "Receive Modal") return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? "USB" : "BLE",
      platform: "LLD",
      page: "Receive",
    };

    if ((error as unknown) instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload, isTrackingEnabled);
    }
    if (verifyAddressError?.name === "UserRefusedAddress") {
      // user refused to confirm address
      track("Address confirmation rejected", defaultPayload, isTrackingEnabled);
    }
    if (inWrongDeviceForAccount) {
      // device used is not associated with the account
      track("Wrong device association", defaultPayload, isTrackingEnabled);
    }
  }, [
    error,
    location,
    isTrackingEnabled,
    device,
    verifyAddressError?.name,
    inWrongDeviceForAccount,
  ]);
};
