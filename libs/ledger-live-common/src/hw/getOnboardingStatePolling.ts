import { from, of, throwError, Observable, TimeoutError } from "rxjs";
import { map, catchError, first, timeout, repeatWhen, delay } from "rxjs/operators";
import getVersion from "./getVersion";
import { withDevice } from "./deviceAccess";
import {
  TransportStatusError,
  DeviceOnboardingStatePollingError,
  DeviceExtractOnboardingStateError,
  DisconnectedDevice,
  CantOpenDevice,
  TransportRaceCondition,
  LockedDeviceError,
  UnexpectedBootloader,
  ExchangeTimeoutError,
} from "@ledgerhq/errors";
import { FirmwareInfo } from "@ledgerhq/types-live";
import { extractOnboardingState, OnboardingState } from "./extractOnboardingState";

export type OnboardingStatePollingResult = {
  onboardingState: OnboardingState | null;
  allowedError: Error | null;
  lockedDevice: boolean;
};

export type GetOnboardingStatePollingResult = Observable<OnboardingStatePollingResult>;

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
 *  Depending on the transport implementation, an "abort timeout" on command executed with the transport might exist
 *  TODO: just use the abortTimeout ? Or set it to fetching - 100 for ex ? And Set by default fetching 
 * @returns An Observable that polls the device onboarding state and pushes an object containing:
 * - onboardingState: the device state during the onboarding
 * - allowedError: any error that is allowed and does not stop the polling
 * - lockedDevice: a boolean set to true if the device is currently locked, false otherwise
 */
export const getOnboardingStatePolling = ({
  deviceId,
  pollingPeriodMs,
  fetchingTimeoutMs = pollingPeriodMs * 10, // Nb Empirical value
}: GetOnboardingStatePollingArgs): GetOnboardingStatePollingResult => {
  console.log(
    `getOnboardingStatePolling: ${JSON.stringify({ fetchingTimeoutMs, pollingPeriodMs })}`,
  );

  const getOnboardingStateOnce = (): Observable<OnboardingStatePollingResult> => {
    return withDevice(deviceId, { openTimeoutMs: pollingPeriodMs - 100 })(t =>
      from(getVersion(t, { abortTimeoutMs: pollingPeriodMs - 100 })),
    ).pipe(
      timeout(fetchingTimeoutMs), // Throws a TimeoutError
      first(),
      catchError((error: unknown) => {
        console.log(`🚨 getOnboardingStatePolling: ERROR: ${JSON.stringify(error)}`);

        if (isAllowedOnboardingStatePollingError(error)) {
          // Pushes the error to the next step to be processed (no retry from the beginning)
          return of(error as Error);
        }

        return throwError(() => error);
      }),
      map((event: FirmwareInfo | Error) => {
        if ("flags" in event) {
          const firmwareInfo = event as FirmwareInfo;
          let onboardingState: OnboardingState | null = null;

          if (firmwareInfo.isBootloader) {
            // Throws so it will be considered a fatal error
            throw new UnexpectedBootloader("Device in bootloader during the polling");
          }

          try {
            onboardingState = extractOnboardingState(firmwareInfo.flags);
          } catch (error: any) {
            if (error instanceof DeviceExtractOnboardingStateError) {
              return {
                onboardingState: null,
                allowedError: error,
                lockedDevice: false,
              };
            } else {
              return {
                onboardingState: null,
                allowedError: new DeviceOnboardingStatePollingError(
                  `SyncOnboarding: Unknown error while extracting the onboarding state ${
                    error?.name ?? error
                  } ${error?.message}`,
                ),
                lockedDevice: false,
              };
            }
          }
          return {
            onboardingState,
            allowedError: null,
            lockedDevice: false,
          };
        } else {
          // If an error is caught previously, and this error is "allowed",
          // the value from the observable is not a FirmwareInfo but an Error
          const allowedError = event as Error;
          console.log(
            `🚨 getOnboardingStatePolling: allowedError: ${JSON.stringify(allowedError)}`,
          );

          return {
            onboardingState: null,
            allowedError: allowedError,
            lockedDevice: allowedError instanceof LockedDeviceError,
          };
        }
      }),
    );
  };

  return getOnboardingStateOnce().pipe(
    repeatWhen(completed => completed.pipe(delay(pollingPeriodMs))),
  );
};

export const isAllowedOnboardingStatePollingError = (error: unknown): boolean => {
  if (
    error &&
    // Timeout error is thrown by rxjs's timeout
    (error instanceof TimeoutError ||
      error instanceof ExchangeTimeoutError ||
      error instanceof DisconnectedDevice ||
      error instanceof CantOpenDevice ||
      error instanceof TransportRaceCondition ||
      error instanceof TransportStatusError ||
      // A locked device is handled as an allowed error
      error instanceof LockedDeviceError)
  ) {
    return true;
  }

  return false;
};
