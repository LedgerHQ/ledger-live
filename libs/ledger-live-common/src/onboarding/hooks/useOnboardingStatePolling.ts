import { useState, useEffect, useCallback } from "react";
import { Subscription } from "rxjs";
import { isEqual } from "lodash";
import type { Device } from "../../hw/actions/types";
import { DeviceOnboardingStatePollingError } from "@ledgerhq/errors";

import type {
  OnboardingStatePollingResult,
  GetOnboardingStatePollingArgs,
  GetOnboardingStatePollingResult,
} from "../../hw/getOnboardingStatePolling";
import { getOnboardingStatePolling as defaultGetOnboardingStatePolling } from "../../hw/getOnboardingStatePolling";
import { OnboardingState } from "../../hw/extractOnboardingState";

export type UseOnboardingStatePollingResult = OnboardingStatePollingResult & {
  fatalError: Error | null;
  resetStates: () => void;
};

export type UseOnboardingStatePollingDependencies = {
  getOnboardingStatePolling?: (
    args: GetOnboardingStatePollingArgs,
  ) => GetOnboardingStatePollingResult;
};

export type UseOnboardingStatePollingArgs = UseOnboardingStatePollingDependencies & {
  device: Device | null;
  pollingPeriodMs: number;
  stopPolling?: boolean;
};

/**
 * Polls the current device onboarding state, and notify the hook consumer of
 * any allowed errors and fatal errors
 * @param getOnboardingStatePolling A polling function, by default set to live-common/hw/getOnboardingStatePolling.
 * This dependency injection is needed for LLD to have the polling working on the internal thread
 * @param device A Device object
 * @param pollingPeriodMs The period in ms after which the device onboarding state is fetched again
 * @param stopPolling Flag to stop or continue the polling
 * @returns An object containing:
 * - onboardingState: the device state during the onboarding
 * - allowedError: any error that is allowed and does not stop the polling
 * - fatalError: any error that is fatal and stops the polling
 * - lockedDevice: a boolean set to true if the device is currently locked, false otherwise
 * - resetStates: a function to reset the values of: onboardingState, allowedError, fatalError and lockedDevice
 */
export const useOnboardingStatePolling = ({
  getOnboardingStatePolling = defaultGetOnboardingStatePolling,
  device,
  pollingPeriodMs,
  stopPolling = false,
}: UseOnboardingStatePollingArgs): UseOnboardingStatePollingResult => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [allowedError, setAllowedError] = useState<Error | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [lockedDevice, setLockedDevice] = useState<boolean>(false);

  useEffect(() => {
    let onboardingStatePollingSubscription: Subscription;

    // If stopPolling is updated and set to true, the useEffect hook will call its
    // cleanup function (return) and the polling won't restart with the below condition
    if (device && !stopPolling) {
      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        pollingPeriodMs,
      }).subscribe({
        next: (onboardingStatePollingResult: OnboardingStatePollingResult) => {
          if (onboardingStatePollingResult) {
            setFatalError(null);
            setLockedDevice(onboardingStatePollingResult.lockedDevice);

            // Only updates if the new allowedError is different
            setAllowedError(prevAllowedError =>
              getNewAllowedErrorIfChanged(
                prevAllowedError,
                onboardingStatePollingResult.allowedError,
              ),
            );

            // Does not update the onboarding state if an allowed error occurred
            if (!onboardingStatePollingResult.allowedError) {
              // Only updates if the new onboardingState is different
              setOnboardingState(prevOnboardingState =>
                getNewOnboardingStateIfChanged(
                  prevOnboardingState,
                  onboardingStatePollingResult.onboardingState,
                ),
              );
            }
          }
        },
        error: error => {
          setAllowedError(null);
          setLockedDevice(false);
          setFatalError(
            error instanceof Error
              ? error
              : new DeviceOnboardingStatePollingError(
                  `Error from: ${error?.name ?? error} ${error?.message}`,
                ),
          );
        },
      });
    }

    return () => {
      onboardingStatePollingSubscription?.unsubscribe();
    };
  }, [
    device,
    pollingPeriodMs,
    setOnboardingState,
    setAllowedError,
    setFatalError,
    stopPolling,
    getOnboardingStatePolling,
  ]);

  const resetStates = useCallback(() => {
    setOnboardingState(null);
    setAllowedError(null);
    setFatalError(null);
    setLockedDevice(false);
  }, []);

  return { onboardingState, allowedError, fatalError, lockedDevice, resetStates };
};

const getNewOnboardingStateIfChanged = (
  prevOnboardingState: OnboardingState | null,
  newOnboardingState: OnboardingState | null,
): OnboardingState | null => {
  return isEqual(prevOnboardingState, newOnboardingState)
    ? prevOnboardingState
    : newOnboardingState;
};

const getNewAllowedErrorIfChanged = (
  prevError: Error | null,
  newError: Error | null,
): Error | null => {
  // Only interested if the errors are instances of the same Error class
  return prevError?.constructor === newError?.constructor ? prevError : newError;
};
