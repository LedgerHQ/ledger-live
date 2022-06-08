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

// Polls the current device onboarding state, and notify the hook consumer of
// any allowed errors and fatal errors
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
      console.log(
        `SyncOnboarding: 🧑‍💻 new device: ${JSON.stringify(device)}`
      );

      onboardingStatePollingSubscription = getOnboardingStatePolling({
        deviceId: device.deviceId,
        pollingPeriodMs,
      }).subscribe({
        next: (onboardingStatePollingResult: OnboardingStatePollingResult) => {
          console.log(
            `SyncOnboarding: device version info ${JSON.stringify(
              onboardingStatePollingResult
            )}`
          );

          if (onboardingStatePollingResult) {
            setFatalError(null);
            setAllowedError(onboardingStatePollingResult.allowedError);

            // Does not update the onboarding state if an allowed error occurred
            if (!onboardingStatePollingResult.allowedError) {
              setOnboardingState(onboardingStatePollingResult.onboardingState);
            }
          }
        },
        error: (error) => {
          console.log(
            `SyncOnboarding: error ending polling ${error} -> ${JSON.stringify({
              error,
            })}`
          );
          setAllowedError(null);
          setFatalError(
            new DeviceOnboardingStatePollingError(
              `Error from: ${error?.name ?? error} ${error?.message}`
            )
          );
        },
      });
    }

    return () => {
      console.log("SyncOnboarding: cleaning up polling 🧹");
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
