import { useRef, useEffect } from "react";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import {
  UserRefusedOnDevice,
  LockedDeviceError,
  CantOpenDevice,
  TransportRaceCondition,
  TransportError,
} from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { LedgerError } from "~/renderer/components/DeviceAction";

export type UseTrackAddAccountModal = {
  location: HOOKS_TRACKING_LOCATIONS.addAccountModal | undefined;
  device: Device;
  error:
    | (LedgerError & {
        name?: string;
        managerAppName?: string;
      })
    | undefined
    | null;
  isTrackingEnabled?: boolean | null | undefined;
  userMustConnectDevice?: boolean | null | undefined;
  isLocked?: boolean | null | undefined;
  requestOpenApp?: string | null | undefined;
};

function getConnectionType(d?: Device): string | undefined {
  if (d?.wired === true) return CONNECTION_TYPES.USB;
  if (d?.wired === false) return CONNECTION_TYPES.BLE;
  return undefined;
}

/**
 * a custom hook to track events in the Add Account Modal.
 * tracks user interactions with the Add Account Modal based on state changes and errors.
 *
 * @param location - current location in the app (expected "Add account modal" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param error - current error state.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 * @param requestOpenApp - optional - the app requested to be opened.
 * @param userMustConnectDevice - optional - flag indicating if the user must connect the device.
 * @param isLocked - optional - flag indicating if the device is locked.
 */
export const useTrackAddAccountModal = ({
  location,
  device,
  error,
  isTrackingEnabled,
  requestOpenApp = null,
  userMustConnectDevice = null,
  isLocked = null,
}: UseTrackAddAccountModal) => {
  const previousOpenAppRequested = useRef<string | null | undefined>(undefined);
  const previousDevice = useRef<Device | null | undefined>(undefined);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.addAccountModal) return;

    const defaultPayload = {
      deviceType: device?.modelId || previousDevice.current?.modelId || undefined,
      connectionType: getConnectionType(device) ?? getConnectionType(previousDevice.current),
      platform: "LLD",
      page: "Add account modal",
    };

    if (error instanceof CantOpenDevice) {
      // device disconnected during account creation
      track("Connection failed", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof TransportRaceCondition) {
      // transport race condition during account creation
      track("Transport race condition", defaultPayload, isTrackingEnabled);
    }

    if (error instanceof TransportError) {
      // transport error during account creation
      track("Transport error", defaultPayload, isTrackingEnabled);
    }

    if (previousOpenAppRequested.current && error instanceof UserRefusedOnDevice) {
      // user refused to open app during account creation
      track("Open app denied", defaultPayload, isTrackingEnabled);
    }

    if (userMustConnectDevice) {
      // device disconnected during account creation
      track("Device connection lost", defaultPayload, isTrackingEnabled);
    }

    if (isLocked || error instanceof LockedDeviceError) {
      // device locked during account creation
      track("Device locked", defaultPayload, isTrackingEnabled);
    }

    previousOpenAppRequested.current = requestOpenApp;
    if (device) previousDevice.current = device;
  }, [error, location, isTrackingEnabled, device, requestOpenApp, userMustConnectDevice, isLocked]);
};
