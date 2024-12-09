import { useState, useEffect } from "react";
import { from, throwError, timer } from "rxjs";
import { first, retry, delay, concatMap } from "rxjs/operators";
import type { FirmwareInfo } from "@ledgerhq/types-live";
import { LockedDeviceError } from "@ledgerhq/errors";
import { withDevice } from "../../hw/deviceAccess";
import { getVersion } from "../../device/use-cases/getVersionUseCase";
import { BleError } from "../types";
import quitApp from "../../hw/quitApp";
import getAppAndVersion from "../../hw/getAppAndVersion";
import { isDashboardName } from "../../hw/isDashboardName";

export type useBleDevicePairingArgs = {
  deviceId: string;
};

export type PairingError = BleError | null;

export type useBleDevicePairingResult = {
  isPaired: boolean;
  pairingError: PairingError;
};

/**
 * Triggers a BLE pairing with a device
 * @param deviceId A BLE device id
 * @returns An object containing:
 * - isPaired: a boolean set to true if the device has been paired, false otherwise
 * - pairingError: any PairingError that occurred, null otherwise
 *
 * When the device is locked, notify the pairing error and retry
 * until the device is unlocked
 */
export const useBleDevicePairing = ({
  deviceId,
}: useBleDevicePairingArgs): useBleDevicePairingResult => {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [pairingError, setPairingError] = useState<PairingError>(null);
  useEffect(() => {
    const subscription = withDevice(deviceId)(t =>
      from(getAppAndVersion(t).then(({ name }) => isDashboardName(name))),
    )
      .pipe(
        concatMap(isInDashboard => {
          if (isInDashboard) {
            return withDevice(deviceId)(t => from(getVersion(t))).pipe(first());
          }
          // If not in the dashboard, quit the app first, then proceed
          return withDevice(deviceId)(t => from(quitApp(t))).pipe(
            delay(2000),
            concatMap(() => withDevice(deviceId)(t => from(getVersion(t))).pipe(first())),
          );
        }),
        retry({
          delay: (err: BleError) => {
            if (err instanceof LockedDeviceError) {
              setPairingError(err);
              return timer(1000);
            }
            return throwError(() => err);
          },
        }),
      )
      .subscribe({
        next: (_value: FirmwareInfo) => {
          setIsPaired(true);
          setPairingError(null);
        },
        error: (error: BleError) => {
          setIsPaired(false);
          setPairingError(error);
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId]);

  return { isPaired, pairingError };
};
