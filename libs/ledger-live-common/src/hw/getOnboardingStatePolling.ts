import { from, of, throwError, Observable, TimeoutError, timer } from "rxjs";
import { map, catchError, first, timeout, repeat } from "rxjs/operators";
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
  TransportExchangeTimeoutError,
  DisconnectedDeviceDuringOperation,
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
  transportAbortTimeoutMs?: number;
  safeGuardTimeoutMs?: number;
};

/**
 * Polls the device onboarding state at a given frequency
 *
 * @param deviceId A device id
 * @param pollingPeriodMs The period in ms after which the device onboarding state is fetched again
 * @param transportAbortTimeoutMs Depending on the transport implementation, an "abort timeout" will be set (and throw an error) when:
 *  - opening a transport instance
 *  - on called commands (where `getVersion`)
 *  Default to (pollingPeriodMs - 100) ms
 * @param safeGuardTimeoutMs For Transport implementations not implementing an "abort timeout", a timeout will be triggered (and throw an error) at this function call level
 * @returns An Observable that polls the device onboarding state and pushes an object containing:
 * - onboardingState: the device state during the onboarding
 * - allowedError: any error that is allowed and does not stop the polling
 * - lockedDevice: a boolean set to true if the device is currently locked, false otherwise
 */
export const getOnboardingStatePolling = ({
  deviceId,
  pollingPeriodMs,
  transportAbortTimeoutMs = pollingPeriodMs - 100,
  safeGuardTimeoutMs = pollingPeriodMs * 10, // Nb Empirical value
}: GetOnboardingStatePollingArgs): GetOnboardingStatePollingResult => {
  const getOnboardingStateOnce = (): Observable<OnboardingStatePollingResult> => {
    return withDevice(deviceId, { openTimeoutMs: transportAbortTimeoutMs })(t =>
      from(getVersion(t, { abortTimeoutMs: transportAbortTimeoutMs })),
    ).pipe(
      timeout(safeGuardTimeoutMs), // Throws a TimeoutError
      first(),
      catchError((error: unknown) => {
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
          } catch (error: unknown) {
            if (error instanceof DeviceExtractOnboardingStateError) {
              return {
                onboardingState: null,
                allowedError: error,
                lockedDevice: false,
              };
            } else {
              let errorMessage = "";
              if (error instanceof Error) {
                errorMessage = `${error.name}: ${error.message}`;
              } else {
                errorMessage = `${error}`;
              }

              return {
                onboardingState: null,
                allowedError: new DeviceOnboardingStatePollingError(
                  `SyncOnboarding: Unknown error while extracting the onboarding state ${errorMessage}`,
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
    repeat({
      delay: _count => timer(pollingPeriodMs),
    }),
  );
};

export const isAllowedOnboardingStatePollingError = (error: unknown): boolean => {
  if (
    error &&
    // Timeout error is thrown by rxjs's timeout
    (error instanceof TimeoutError ||
      error instanceof TransportExchangeTimeoutError ||
      error instanceof DisconnectedDevice ||
      error instanceof DisconnectedDeviceDuringOperation ||
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
