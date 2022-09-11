import {
  from,
  merge,
  partition,
  of,
  throwError,
  Observable,
  TimeoutError,
} from "rxjs";
import { map, catchError, repeat, first, timeout } from "rxjs/operators";
import getVersion from "./getVersion";
import { withDevice } from "./deviceAccess";
import {
  TransportStatusError,
  DeviceOnboardingStatePollingError,
  DeviceExtractOnboardingStateError,
  DisconnectedDevice,
  CantOpenDevice,
  TransportRaceCondition,
} from "@ledgerhq/errors";
import { FirmwareInfo } from "@ledgerhq/types-live";
import {
  extractOnboardingState,
  OnboardingState,
} from "./extractOnboardingState";

export type OnboardingStatePollingResult = {
  onboardingState: OnboardingState | null;
  allowedError: Error | null;
};

export type GetOnboardingStatePollingResult =
  Observable<OnboardingStatePollingResult>;

export type GetOnboardingStatePollingArgs = {
  deviceId: string;
  pollingPeriodMs: number;
  fetchingTimeoutMs?: number;
};

/**
 * Polls the device onboarding state at a given frequency
 * @param deviceId A device id
 * @param pollingPeriodMs The period in ms after which the device onboarding state is fetched again
 * @param fetchingTimeoutMs The time to wait while fetching for the device onboarding state before throwing an error, in ms
 * @returns An Observable that polls the device onboarding state
 */
export const getOnboardingStatePolling = ({
  deviceId,
  pollingPeriodMs,
  fetchingTimeoutMs = pollingPeriodMs,
}: GetOnboardingStatePollingArgs): GetOnboardingStatePollingResult => {
  let firstRun = true;

  const delayedOnceOnboardingStateObservable: Observable<OnboardingStatePollingResult> =
    new Observable((subscriber) => {
      const delayMs = firstRun ? 0 : pollingPeriodMs;
      firstRun = false;

      const getOnboardingStateOnce = () => {
        const firmwareInfoOrAllowedErrorObservable = withDevice(deviceId)((t) =>
          from(getVersion(t))
        ).pipe(
          timeout(fetchingTimeoutMs), // Throws a TimeoutError
          first(),
          catchError((error: any) => {
            if (isAllowedOnboardingStatePollingError(error)) {
              // Pushes the error to the next step to be processed (no retry from the beginning)
              return of(error);
            }

            return throwError(error);
          })
        );

        // If an error is catched previously, and this error is "allowed",
        // the value from the observable is not a FirmwareInfo but an Error
        const [firmwareInfoObservable, allowedErrorObservable] = partition(
          firmwareInfoOrAllowedErrorObservable,
          // TS cannot infer correctly the value given to RxJS partition
          (value: any) => Boolean(value?.flags)
        );

        const onboardingStateFromFirmwareInfoObservable =
          firmwareInfoObservable.pipe(
            map((firmwareInfo: FirmwareInfo) => {
              let onboardingState: OnboardingState | null = null;

              try {
                onboardingState = extractOnboardingState(firmwareInfo.flags);
              } catch (error: any) {
                if (error instanceof DeviceExtractOnboardingStateError) {
                  return {
                    onboardingState: null,
                    allowedError: error,
                  };
                } else {
                  return {
                    onboardingState: null,
                    allowedError: new DeviceOnboardingStatePollingError(
                      `SyncOnboarding: Unknown error while extracting the onboarding state ${
                        error?.name ?? error
                      } ${error?.message}`
                    ),
                  };
                }
              }
              return { onboardingState, allowedError: null };
            })
          );

        // Handles the case of an (allowed) Error value
        const onboardingStateFromAllowedErrorObservable =
          allowedErrorObservable.pipe(
            map((allowedError: Error) => {
              return {
                onboardingState: null,
                allowedError: allowedError,
              };
            })
          );

        return merge(
          onboardingStateFromFirmwareInfoObservable,
          onboardingStateFromAllowedErrorObservable
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

  return delayedOnceOnboardingStateObservable.pipe(repeat());
};

export const isAllowedOnboardingStatePollingError = (
  error: unknown
): boolean => {
  if (
    error &&
    // Timeout error is thrown by rxjs's timeout
    (error instanceof TimeoutError ||
      error instanceof DisconnectedDevice ||
      error instanceof CantOpenDevice ||
      error instanceof TransportRaceCondition ||
      error instanceof TransportStatusError)
  ) {
    return true;
  }

  return false;
};
