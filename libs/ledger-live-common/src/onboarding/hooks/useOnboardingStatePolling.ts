import { useState, useEffect } from "react";
import { Subscription } from "rxjs";
import type { Device } from "../../hw/actions/types";
import { DeviceOnboardingStatePollingError } from "@ledgerhq/errors";

import type { OnboardingStatePollingResult } from "../../hw/getOnboardingStatePolling";
import { getOnboardingStatePolling } from "../../hw/getOnboardingStatePolling";
import { OnboardingState } from "../../hw/extractOnboardingState";

export type UseOnboardingStatePollingResult = OnboardingStatePollingResult & {
  fatalError: Error | null;
};

/**
 * Polls the current device onboarding state, and notify the hook consumer of
 * any allowed errors and fatal errors
 * @param device A Device object
 * @param pollingPeriodMs The period in ms after which the device onboarding state is fetched again
 * @param stopPolling Flag to stop or continue the polling
 * @returns An object containing:
 * - onboardingState: the device state during the onboarding
 * - allowedError: any error that is allowed and does not stop the polling
 * - fatalError: any error that is fatal and stops the polling
 */
export const useOnboardingStatePolling = ({
  device,
  pollingPeriodMs,
  stopPolling = false,
}: {
  device: Device | null;
  pollingPeriodMs: number;
  stopPolling?: boolean;
}): UseOnboardingStatePollingResult => {
  const [onboardingState, setOnboardingState] =
    useState<OnboardingState | null>(null);
  const [allowedError, setAllowedError] = useState<Error | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

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
            setAllowedError((prevAllowedError) => {
              // Only updates if the new allowedError is different
              if (
                isDifferentError(
                  prevAllowedError,
                  onboardingStatePollingResult.allowedError
                )
              ) {
                return onboardingStatePollingResult.allowedError;
              }

              return prevAllowedError;
            });

            // Does not update the onboarding state if an allowed error occurred
            if (!onboardingStatePollingResult.allowedError) {
              setOnboardingState((prevOnboardingState) => {
                // Only updates if the new onboardingState is different
                if (
                  isDifferentOnboardingState(
                    prevOnboardingState,
                    onboardingStatePollingResult.onboardingState
                  )
                ) {
                  return onboardingStatePollingResult.onboardingState;
                }

                return prevOnboardingState;
              });
            }
          }
        },
        error: (error) => {
          setAllowedError(null);
          setFatalError(
            error instanceof Error
              ? error
              : new DeviceOnboardingStatePollingError(
                  `Error from: ${error?.name ?? error} ${error?.message}`
                )
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
  ]);

  return { onboardingState, allowedError, fatalError };
};

const isDifferentOnboardingState = (
  prevOnboardingState: OnboardingState | null,
  newOnboardingState: OnboardingState | null
): boolean => {
  // OnboardingState are simple JSON-style objects, without methods
  return (
    JSON.stringify(prevOnboardingState) !== JSON.stringify(newOnboardingState)
  );
};

const isDifferentError = (
  prevError: Error | null,
  newError: Error | null
): boolean => {
  // Only interested if the errors are instances of the same Error class
  return prevError?.constructor !== newError?.constructor;
};
