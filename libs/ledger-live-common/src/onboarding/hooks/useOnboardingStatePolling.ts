import { useState, useEffect } from "react";
import {
  from,
  merge,
  partition,
  of,
  throwError,
  Observable,
  Subscription,
  TimeoutError,
} from "rxjs";
import { map, catchError, repeat, first, timeout } from "rxjs/operators";
import getVersion from "../../hw/getVersion";
import { withDevice } from "../../hw/deviceAccess";
import type { Device } from "../../hw/actions/types";
import {
  TransportStatusError,
  DeviceOnboardingStatePollingError,
  DeviceExtractOnboardingStateError,
} from "@ledgerhq/errors";
import { FirmwareInfo } from "../../types/manager";
import {
  extractOnboardingState,
  OnboardingState,
} from "../../hw/extractOnboardingState";

export type OnboardingStatePollingResult = {
  onboardingState: OnboardingState | null;
  allowedError: Error | null;
};

export type UseOnboardingStatePollingResult = OnboardingStatePollingResult & {
  fatalError: Error | null;
};

// Polls the current device onboarding state
// TODO dependency injection withDevice (and getVersion ?) to easily test ?
// or dependency injection in onboardingStatePolling ?
export const useOnboardingStatePolling = ({
  device,
  pollingPeriodMs,
  stopPolling = false,
}: {
  device: Device | null;
  pollingPeriodMs: number;
  stopPolling?: boolean;
}): UseOnboardingStatePollingResult => {
  const [onboardingStatePollingResult, setOnboardingStatePollingResult] =
    useState<OnboardingStatePollingResult>({
      onboardingState: null,
      allowedError: null,
    });

  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    let onboardingStatePollingSubscription: Subscription;

    // If stopPolling is updated and set to true, the useEffect hook will call its
    // cleanup function (return) and the polling won't restart with the below condition
    if (device && !stopPolling) {
      console.log(
        `SyncOnboarding: 🧑‍💻 new device: ${JSON.stringify(device)}`
      );

      onboardingStatePollingSubscription = onboardingStatePolling({
        deviceId: device.deviceId,
        pollingPeriodMs,
      }).subscribe({
        next: (onboardingStatePollingResult: OnboardingStatePollingResult) => {
          console.log(
            `SyncOnboarding: device version info ${JSON.stringify(
              onboardingStatePollingResult
            )}`
          );

          // Does not update the state if it could not be extracted from the flags
          if (onboardingStatePollingResult) {
            console.log(
              "SyncOnboarding: onboarding state from polling is not null"
            );
            setOnboardingStatePollingResult(onboardingStatePollingResult);
          }
        },
        error: (error) => {
          console.log(
            `SyncOnboarding: error ending polling ${error} -> ${JSON.stringify({
              error,
            })}`
          );
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
  }, [device, pollingPeriodMs, setOnboardingStatePollingResult, stopPolling]);

  return { ...onboardingStatePollingResult, fatalError };
};

// TODO: Put in live-common/src/onboarding/onboardingStatePolling ?
export const onboardingStatePolling = ({
  deviceId,
  pollingPeriodMs,
}: {
  deviceId: string;
  pollingPeriodMs: number;
}): Observable<OnboardingStatePollingResult> => {
  console.log("🏎 GOING TO START");

  // Could just be a boolean: firstRun ?
  let i = 0;

  const delayedOnboardingStateOnce$: Observable<OnboardingStatePollingResult> =
    new Observable((subscriber) => {
      console.log(`SyncOnboarding: ▶️ Polling from Observable ${i}`);
      const delayMs = i > 0 ? pollingPeriodMs : 0;
      console.log(`SyncOnboarding: polling delayed by ${delayMs} ms`);
      i++;

      const getOnboardingStateOnce = () => {
        const firmwareInfoOrAllowedError$ = withDevice(deviceId)((t) =>
          from(getVersion(t))
        ).pipe(
          // TODO: choose timeout ms value. For now = polling period
          timeout(pollingPeriodMs), // Throws a TimeoutError
          first(),
          catchError((error: any) => {
            if (isAllowedOnboardingStatePollingError(error)) {
              // Pushes the error to the next step to be processed (no retry from the beginning)
              return of(error);
            }

            console.log(
              `SyncOnboarding: 💥 Fatal Error ${error} -> ${JSON.stringify(
                error
              )}`
            );
            return throwError(error);
          })
        );

        // If an error is catched previously, and this error is "allowed",
        // the value from the observable is not a FirmwareInfo but an Error
        const [firmwareInfo$, allowedError$] = partition(
          firmwareInfoOrAllowedError$,
          (value) => !!value?.flags
        );

        // Handles the case of a FirmwareInfo value
        const onboardingStateFromFirmwareInfo$ = firmwareInfo$.pipe(
          map((firmwareInfo: FirmwareInfo) => {
            console.log(
              `SyncOnboarding: ♧ MAP got firmwareInfo: ${JSON.stringify(
                firmwareInfo
              )}`
            );

            let onboardingState: OnboardingState | null = null;

            try {
              onboardingState = extractOnboardingState(firmwareInfo.flags);
            } catch (error) {
              console.log(
                `SyncOnboarding: extract onboarding error ${JSON.stringify(
                  error
                )}`
              );
              if (error instanceof DeviceExtractOnboardingStateError) {
                return {
                  onboardingState: null,
                  allowedError:
                    error as typeof DeviceExtractOnboardingStateError,
                };
              } else {
                return {
                  onboardingState: null,
                  allowedError: new DeviceOnboardingStatePollingError(
                    "SyncOnboarding: Unknown error while extracting the onboarding state"
                  ),
                };
              }
            }
            return { onboardingState, allowedError: null };
          })
        );

        // Handles the case of an (allowed) Error value
        const onboardingStateFromAllowedError$ = allowedError$.pipe(
          map((allowedError: Error) => {
            console.log(
              `SyncOnboarding: ♧ MAP got accepted error: ${JSON.stringify(
                allowedError
              )}`
            );
            return {
              onboardingState: null,
              allowedError: allowedError,
            };
          })
        );

        return merge(
          onboardingStateFromFirmwareInfo$,
          onboardingStateFromAllowedError$
        );
      };

      // Delays the fetch of the onboarding state
      setTimeout(() => {
        getOnboardingStateOnce().subscribe({
          next: (value: OnboardingStatePollingResult) => {
            subscriber.next(value);
          },
          error: (error: any) => {
            subscriber.error(error);
          },
          complete: () => subscriber.complete(),
        });
      }, delayMs);
    });

  return delayedOnboardingStateOnce$.pipe(repeat());
};

// TODO: decide which errors are allowed
export const isAllowedOnboardingStatePollingError = (
  error: Error | any
): boolean => {
  // Timeout error thrown by rxjs's timeout
  if (error && error instanceof TimeoutError) {
    console.log(`SyncOnboarding: timeout error ⌛️ ${JSON.stringify(error)}`);
    return true;
  }

  // Transport error: retry polling
  if (
    error &&
    error instanceof TransportStatusError
    // error.statusCode === 0x6d06
  ) {
    console.log(`SyncOnboarding: 0x6d06 error 🔨 ${JSON.stringify(error)}`);
    return true;
  }
  // Disconnection error: retry polling
  if (error && error instanceof Error && error.name === "DisconnectedDevice") {
    console.log(
      `SyncOnboarding: disconnection error 🔌 ${JSON.stringify(error)}`
    );
    return true;
  }

  if (error && error instanceof Error && error.name === "CantOpenDevice") {
    console.log(
      `SyncOnboarding: cannot open device error 🔌 ${JSON.stringify(error)}`
    );
    return true;
  }

  return false;
};
