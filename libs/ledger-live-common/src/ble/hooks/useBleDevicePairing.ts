import { useState, useEffect } from "react";
import { from } from "rxjs";
import { first } from "rxjs/operators";
import { withDevice } from "../../hw/deviceAccess";
import getVersion from "../../hw/getVersion";
import { FirmwareInfo } from "../../types/manager";
import { BleError } from "../types";

export type useBleDevicePairingArgs = {
  deviceId: string;
};

export type PairingError = BleError | null;

export type useBleDevicePairingResult = {
  isPaired: boolean;
  pairingError: PairingError;
};

export const useBleDevicePairing = ({
  deviceId,
}: useBleDevicePairingArgs): useBleDevicePairingResult => {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [pairingError, setPairingError] = useState<PairingError>(null);

  useEffect(() => {
    const requestObservable = withDevice(deviceId)((t) =>
      from(getVersion(t))
    ).pipe(first());

    requestObservable.subscribe({
      next: (value: FirmwareInfo) => {
        console.log(`🦄 go paired value: ${value}`);

        setIsPaired(true);
        setPairingError(null);
      },
      error: (error: BleError) => {
        console.log(`🦁 ERROR while pairing: ${error}`);

        setIsPaired(false);
        setPairingError(error);
      },
    });
  }, [deviceId]);

  return { isPaired, pairingError };
};
