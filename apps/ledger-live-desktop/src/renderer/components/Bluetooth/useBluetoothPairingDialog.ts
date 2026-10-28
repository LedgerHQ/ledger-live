import { useCallback, useEffect, useState } from "react";
import {
  BLUETOOTH_PAIRING_TIMEOUT_MS,
  BLUETOOTH_PASSKEY_PATTERN,
  type BluetoothPairingRequest,
} from "~/bridge/contract";
import { bluetooth } from "~/renderer/bridge";

export type BluetoothPairingDialogViewModel = {
  request: BluetoothPairingRequest | null;
  pin: string;
  isPinValid: boolean;
  onPinChange: (pin: string) => void;
  onConfirm: () => void;
  onRefuse: () => void;
};

/** Asks the user to compare or type the Bluetooth pairing code. Never confirms on its own. */
export function useBluetoothPairingDialog(): BluetoothPairingDialogViewModel {
  const [request, setRequest] = useState<BluetoothPairingRequest | null>(null);
  const [pin, setPin] = useState("");

  useEffect(
    () =>
      bluetooth.onPairingRequest(nextRequest => {
        setPin("");
        setRequest(nextRequest);
      }),
    [],
  );

  useEffect(() => {
    if (!request) return;
    const timeout = setTimeout(() => setRequest(null), BLUETOOTH_PAIRING_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [request]);

  const isPinValid = BLUETOOTH_PASSKEY_PATTERN.test(pin);

  const onConfirm = useCallback(() => {
    if (!request) return;
    if (request.pairingKind === "providePin") {
      if (!isPinValid) return;
      bluetooth.respondToPairing(request.requestId, { confirmed: true, pin });
    } else {
      bluetooth.respondToPairing(request.requestId, { confirmed: true });
    }
    setRequest(null);
  }, [isPinValid, pin, request]);

  const onRefuse = useCallback(() => {
    if (!request) return;
    bluetooth.respondToPairing(request.requestId, { confirmed: false });
    setRequest(null);
  }, [request]);

  return { request, pin, isPinValid, onPinChange: setPin, onConfirm, onRefuse };
}
