import { useEffect } from "react";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import {
  UserRefusedOnDevice,
  UserRefusedAddress,
  TransportRaceCondition,
  LockedDeviceError,
  CantOpenDevice,
  TransportError,
} from "@ledgerhq/errors";
import { LedgerError } from "~/renderer/components/DeviceAction";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

export type UseTrackReceiveFlow = {
  location: HOOKS_TRACKING_LOCATIONS.receiveModal | undefined;
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
  isLocked?: boolean | null | undefined;
};

/**
 * a custom hook to track events in the Receive modal.
 * tracks user interactions with the Receive modal based on state changes and errors.
 *
 * @param location - current location in the app (expected "Receive Modal" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param verifyAddressError - optional - error from verifying address.
 * @param error - optional - current error state.
 * @param inWrongDeviceForAccount - optional - error from verifying address.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 * @param isLocked - optional - flag indicating if the device is locked.
 */
export const useTrackReceiveFlow = ({
  location,
  device,
  verifyAddressError = null,
  error = null,
  inWrongDeviceForAccount = null,
  isTrackingEnabled,
  isLocked,
}: UseTrackReceiveFlow) => {
  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.receiveModal) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLD",
      page: "Receive",
    };

    if (error instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof TransportRaceCondition) {
      // transport race condition
      track("Transport race condition", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof CantOpenDevice) {
      // device disconnected during receive flow
      track("Connection failed", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof TransportError) {
      // transport error during receive flow
      track("Transport error", defaultPayload, isTrackingEnabled);
    }

    if (isLocked || error instanceof LockedDeviceError) {
      // device locked during receive flow
      track("Device locked", defaultPayload, isTrackingEnabled);
    }

    if ((verifyAddressError as unknown) instanceof UserRefusedAddress) {
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
    inWrongDeviceForAccount,
    verifyAddressError,
    isLocked,
  ]);
};
