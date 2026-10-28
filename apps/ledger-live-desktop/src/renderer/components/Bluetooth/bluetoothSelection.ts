/**
 * Outcome of the latest Bluetooth device chooser request, written by `BluetoothDeviceChooser`
 * and read by `useConnectBluetooth` once `requestBluetoothDevice` settles. It tells a user
 * cancellation apart from a failure, and gives the main-process device id that was selected.
 */
export type BluetoothSelectionOutcome =
  | { type: "selected"; deviceId: string }
  | { type: "cancelled" };

let latestOutcome: BluetoothSelectionOutcome | null = null;

export function recordBluetoothSelection(outcome: BluetoothSelectionOutcome): void {
  latestOutcome = outcome;
}

export function resetBluetoothSelection(): void {
  latestOutcome = null;
}

/** Reads the latest outcome without consuming it. */
export function peekBluetoothSelection(): BluetoothSelectionOutcome | null {
  return latestOutcome;
}

/** Returns the latest outcome and forgets it, so it is consumed by a single request. */
export function takeBluetoothSelection(): BluetoothSelectionOutcome | null {
  const outcome = latestOutcome;
  latestOutcome = null;
  return outcome;
}
