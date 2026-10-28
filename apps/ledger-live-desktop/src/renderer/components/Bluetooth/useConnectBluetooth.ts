import { delay } from "@ledgerhq/live-common/promise";
import { useCallback, useState } from "react";
import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { log } from "@ledgerhq/logs";
import {
  requestBluetoothDevice,
  useDeviceManagementKit,
  webBleTransportIdentifier,
} from "@ledgerhq/live-dmk-desktop";
import { dmkToLedgerDeviceIdMap, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import { useDispatch } from "LLD/hooks/redux";
import { rememberKnownDevice } from "~/renderer/reducers/knownDevices";
import {
  peekBluetoothSelection,
  resetBluetoothSelection,
  takeBluetoothSelection,
} from "./bluetoothSelection";

export type BluetoothConnectionStatus = "idle" | "searching" | "cancelled" | "failed";

/** i18n key of the message shown under a Bluetooth connect button, by status. */
export const BLUETOOTH_STATUS_MESSAGE_KEYS: Partial<Record<BluetoothConnectionStatus, string>> = {
  failed: "bluetooth.connect.failed",
  cancelled: "bluetooth.connect.cancelled",
};

export type ConnectBluetooth = {
  status: BluetoothConnectionStatus;
  connect: () => Promise<void>;
};

/** `Error` fields are not enumerable: spell them out so the logs keep the failure reason. */
const describeError = (error: unknown): Record<string, unknown> =>
  error instanceof Error
    ? { name: error.name, message: error.message, cause: describeError(error.cause) }
    : { value: error };

/** A cancellation this fast cannot come from the user: Chromium closed the scan by itself. */
const SPURIOUS_CANCEL_MAX_MS = 1_000;
/**
 * Waits before each new scan (3 s in total). Chromium cancels these scans within a few
 * milliseconds, so the retries stay inside its 5 s user-activation window, which
 * `requestDevice` requires.
 */
const SPURIOUS_CANCEL_RETRY_DELAYS_MS = [500, 1_000, 1_500];

/**
 * On macOS the first scans of the process are cancelled by Chromium within a few milliseconds
 * (`NotFoundError`, before any device event) while its Bluetooth adapter is still initializing;
 * a scan started a moment later works. Fast cancellations are retried after a short wait.
 * A cancellation made through the in-app chooser is recorded and never retried.
 */
async function requestBluetoothDeviceWithRetry(
  dmk: DeviceManagementKit,
): Promise<DiscoveredDevice> {
  for (const retryDelayMs of [...SPURIOUS_CANCEL_RETRY_DELAYS_MS, null]) {
    const startedAt = Date.now();
    try {
      return await requestBluetoothDevice(dmk);
    } catch (error) {
      const isSpuriousCancel =
        error instanceof Error &&
        error.name === "NotFoundError" &&
        Date.now() - startedAt < SPURIOUS_CANCEL_MAX_MS &&
        peekBluetoothSelection() === null;
      if (!isSpuriousCancel || retryDelayMs === null) throw error;
      log("ble", `Bluetooth scan cancelled by Chromium, retrying in ${retryDelayMs} ms`);
      await delay(retryDelayMs);
    }
  }
  throw new Error("Unreachable: the last attempt rethrows");
}

/**
 * Asks Web Bluetooth for a Ledger (the in-app chooser lets the user pick it) and remembers the
 * selected device, so the chooser auto-selects it next time. Must run from a user gesture.
 */
export function useConnectBluetooth(
  onDeviceRemembered?: (knownDevice: KnownDevice) => void,
): ConnectBluetooth {
  const dmk = useDeviceManagementKit();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<BluetoothConnectionStatus>("idle");

  const connect = useCallback(async () => {
    setStatus("searching");
    resetBluetoothSelection();
    try {
      const discoveredDevice = await requestBluetoothDeviceWithRetry(dmk);
      const selection = takeBluetoothSelection();
      if (selection?.type === "selected") {
        const knownDevice: KnownDevice = {
          transport: webBleTransportIdentifier,
          id: selection.deviceId,
          deviceModelId: dmkToLedgerDeviceIdMap[discoveredDevice.deviceModel.model],
          name: discoveredDevice.name || null,
        };
        dispatch(rememberKnownDevice(knownDevice));
        onDeviceRemembered?.(knownDevice);
      }
      setStatus("idle");
    } catch (error) {
      log("ble", "Bluetooth device request failed", describeError(error));
      setStatus(takeBluetoothSelection()?.type === "cancelled" ? "cancelled" : "failed");
    }
  }, [dispatch, dmk, onDeviceRemembered]);

  return { status, connect };
}
