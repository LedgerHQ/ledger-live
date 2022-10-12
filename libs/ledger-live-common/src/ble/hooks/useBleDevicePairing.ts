import { useState, useEffect } from "react";
import { from } from "rxjs";
import { first } from "rxjs/operators";
import type { FirmwareInfo } from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import getVersion from "../../hw/getVersion";
import { BleError } from "../types";

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
 */
export const useBleDevicePairing = ({
  deviceId,
}: useBleDevicePairingArgs): useBleDevicePairingResult => {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [pairingError, setPairingError] = useState<PairingError>(null);

  useEffect(() => {
    const requestObservable = withDevice(deviceId)((t) =>
      from(getVersion(t))
    ).pipe(first());

    const sub = requestObservable.subscribe({
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
      sub.unsubscribe();
    };
  }, [deviceId]);

  return { isPaired, pairingError };
};
