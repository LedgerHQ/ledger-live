import { useEffect, useRef } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { CantOpenDevice, LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { LedgerError } from "~/types/error";

export type UseTrackAddAccountFlow = {
  location: HOOKS_TRACKING_LOCATIONS.addAccount | undefined;
  device: Device;
  requestOpenApp?: string | null | undefined;
  allowOpeningGranted?: boolean | null | undefined;
  isScanningForNewAccounts?: boolean | null | undefined;
  error: LedgerError | undefined | null;
};

type BoundedQueueOfFive = readonly [boolean, boolean, boolean, boolean, boolean];

const boundedQueue = {
  initialValue: [false, false, false, false, false] as BoundedQueueOfFive,
  update: (currentState: boolean, queue: BoundedQueueOfFive): BoundedQueueOfFive => {
    const [, ...tail] = queue;
    return [...tail, currentState] as BoundedQueueOfFive;
  },
};

/**
 * a custom hook to track events in the AddAccount flow.
 * tracks user interactions with in the AddAccount flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Add Account" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param requestOpenApp - optional - which app if any has been requested to be opened.
 * @param allowOpeningGranted - optional - indicating if the user has granted permission to open the app.
 * @param isScanningForNewAccounts - optional - indicating if the app is scanning for new accounts.
 * @param error - current error state.
 */
export const useTrackAddAccountFlow = ({
  location,
  device,
  requestOpenApp = undefined,
  allowOpeningGranted = undefined,
  isScanningForNewAccounts = undefined,
  error,
}: UseTrackAddAccountFlow) => {
  const previousRequestOpenApp = useRef<string | null | undefined>(undefined);
  const previousAllowOpeningGranted = useRef<boolean | null | undefined>(undefined);
  // using a bounded queue to track the last 5 values of allowOpeningGranted to cope with re-renders
  const allowOpeningGrantedBoundedQueue = useRef<BoundedQueueOfFive>(boundedQueue.initialValue);

  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.addAccount) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Add account",
    };

    if (previousRequestOpenApp.current && !requestOpenApp && error instanceof UserRefusedOnDevice) {
      // user refused to open app
      track("Open app denied", defaultPayload);
    }

    if (
      allowOpeningGrantedBoundedQueue.current.includes(true) &&
      !allowOpeningGranted &&
      error instanceof CantOpenDevice
    ) {
      // user lost connection after opening app
      track("Device connection lost", defaultPayload);
      // reset queue
      allowOpeningGrantedBoundedQueue.current = boundedQueue.initialValue;
    }

    if (isScanningForNewAccounts && error instanceof CantOpenDevice) {
      // user lost connection while scanning for new accounts
      track("Device connection lost", defaultPayload);
    } else if (error instanceof CantOpenDevice) {
      // device is detected but connection failed
      track("Connection failed", defaultPayload);
    }

    if (previousAllowOpeningGranted.current && error instanceof LockedDeviceError) {
      // device is locked while scanning for new accounts
      track("Device locked", defaultPayload);
    }

    if (previousAllowOpeningGranted.current !== allowOpeningGranted) {
      allowOpeningGrantedBoundedQueue.current = boundedQueue.update(
        !!allowOpeningGranted,
        allowOpeningGrantedBoundedQueue.current,
      );
    }

    previousRequestOpenApp.current = requestOpenApp;
    previousAllowOpeningGranted.current = allowOpeningGranted;
  }, [error, location, device, requestOpenApp, allowOpeningGranted, isScanningForNewAccounts]);
};
