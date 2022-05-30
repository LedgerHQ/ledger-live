import { useState, useEffect } from "react";
import {
  from,
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
}: {
  device: Device | null;
  pollingPeriodMs: number;
}): UseOnboardingStatePollingResult => {
  const [onboardingStatePollingResult, setOnboardingStatePollingResult] =
    useState<OnboardingStatePollingResult>({
      onboardingState: null,
      allowedError: null,
    });

  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    let onboardingStatePollingSubscription: Subscription;

    if (device) {
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
          // FIXME: if null -> initialState ? What should be the initialOnboardingState ?
          // Does not update the state if it could not be extracted from the flags
          if (onboardingStatePollingResult) {
            console.log("SETTING THE ONBOARDING STATE POLLING RESULT");
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
  }, [device, pollingPeriodMs, setOnboardingStatePollingResult]);

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
  // getDelayedOnboardingStateOnce
  const getDelayedOnboardingStateOnce: Observable<OnboardingStatePollingResult> =
    new Observable((subscriber) => {
      console.log(`SyncOnboarding: ▶️ Polling from Observable ${i}`);
      const delayMs = i > 0 ? pollingPeriodMs : 0;
      console.log(`SyncOnboarding: polling delayed by ${delayMs} ms`);
      i++;

      const getOnboardingStateOnce =
        (): Observable<OnboardingStatePollingResult> =>
          withDevice(deviceId)((t) => from(getVersion(t))).pipe(
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
            }),
            map((deviceVersionOrAllowedError: FirmwareInfo | Error) => {
              // TODO: better safe guard function ?
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              if (deviceVersionOrAllowedError?.flags) {
                console.log(
                  `SyncOnboarding: ♧ MAP got firmwareInfo: ${JSON.stringify(
                    deviceVersionOrAllowedError
                  )}`
                );

                let onboardingState: OnboardingState | null = null;

                try {
                  onboardingState = extractOnboardingState(
                    (deviceVersionOrAllowedError as FirmwareInfo).flags
                  );
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
              }

              console.log(
                `SyncOnboarding: ♧ MAP got accepted error: ${JSON.stringify(
                  deviceVersionOrAllowedError
                )}`
              );
              return {
                onboardingState: null,
                allowedError: deviceVersionOrAllowedError as Error,
              };
            })
          );

      // Delays the fetch of the onboarding state
      setTimeout(() => {
        getOnboardingStateOnce().subscribe({
          next: (value: OnboardingStatePollingResult) => {
            subscriber.next(value);
          },
          error: (error: any) => {
            subscriber.error(error);
          },
          // Import for repeat()
          complete: () => subscriber.complete(),
        });
      }, delayMs);
    });

  return getDelayedOnboardingStateOnce.pipe(repeat());
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
