import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { DeviceStatus } from "@ledgerhq/device-management-kit";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { firstValueFrom } from "rxjs";
import { filter, timeout } from "rxjs/operators";
import { createDeviceManagementKit } from "./dmk";
import { WalletCliDmkTransport } from "./wallet-cli-dmk-transport";

/** Device id passed to live-common `withDevice` / bridge methods for the first USB Ledger (DMK node WebUSB). */
export const WALLET_CLI_DMK_DEVICE_ID = "wallet-cli-dmk";

const CONNECT_TIMEOUT_MS = 60_000;

const MODULE_ID = "wallet-cli-dmk-webusb";

type Singleton = {
  dmk: DeviceManagementKit;
  transport: WalletCliDmkTransport;
};

let singleton: Singleton | null = null;
/** One DMK per CLI process: each `createDeviceManagementKit()` adds node-usb hotplug listeners; closing + recreating stacks listeners and breaks the 3rd+ in-process connect (same pattern as the former node-hid kit). */
let persistentDmk: DeviceManagementKit | null = null;
let exitHooksRegistered = false;

function closeDmkQuietly(dmk: DeviceManagementKit): void {
  try {
    dmk.close();
  } catch {
    // close() may throw if the transport is already torn down
  }
}

function getOrCreatePersistentDmk(): DeviceManagementKit {
  if (!persistentDmk) {
    persistentDmk = createDeviceManagementKit();
  }
  return persistentDmk;
}

async function connectFirstUsbDevice(dmk: DeviceManagementKit): Promise<string> {
  const discovered = await firstValueFrom(
    dmk.listenToAvailableDevices({}).pipe(
      filter((list: DiscoveredDevice[]) => list.length > 0),
      timeout(CONNECT_TIMEOUT_MS),
    ),
  );
  const device = discovered[0];
  if (!device) {
    throw new Error("No Ledger device found. Unlock the device and try again.");
  }
  const sessionId = await dmk.connect({ device });

  const sessionState = await firstValueFrom(dmk.getDeviceSessionState({ sessionId })).catch(
    () => null,
  );
  const status =
    sessionState && typeof sessionState === "object" && "deviceStatus" in sessionState
      ? sessionState.deviceStatus
      : null;

  if (status === DeviceStatus.BUSY) {
    await dmk.disconnect({ sessionId }).catch(() => {});
    throw new Error(
      "[wallet-cli] The Ledger device did not respond to the initial ping. " +
        "Please run the command again — the retry usually succeeds.",
    );
  }
  return sessionId;
}

/**
 * Ensures a DMK USB session exists and returns the shared transport (same instance across `open()` calls until reset).
 *
 * The session refresher is left enabled (default) so the DMK periodically pings the device and
 * keeps session state (CONNECTED / LOCKED / BUSY) up to date — matching the DMK sample app behaviour.
 * If the initial session state is BUSY we disconnect and ask the user to retry.
 */
export async function ensureWalletCliDmkTransport(): Promise<WalletCliDmkTransport> {
  if (singleton) {
    return singleton.transport;
  }

  const dmk = getOrCreatePersistentDmk();
  const sessionId = await connectFirstUsbDevice(dmk);
  const transport = new WalletCliDmkTransport(dmk, sessionId);
  singleton = { dmk, transport };
  return transport;
}

/**
 * Drops the active USB session so the device can be used again, without tearing down the process-wide DMK
 * (see `persistentDmk`). Call {@link disposeWalletCliDmkTransportFully} on process exit.
 */
export async function resetWalletCliDmkSession(): Promise<void> {
  const held = singleton;
  if (!held) {
    return;
  }
  singleton = null;
  await held.dmk.disconnect({ sessionId: held.transport.sessionId }).catch(() => {});
}

/** Disconnect any live session and `dmk.close()` the persistent kit (USB hotplug listeners). */
export async function disposeWalletCliDmkTransportFully(): Promise<void> {
  await resetWalletCliDmkSession();
  if (persistentDmk) {
    closeDmkQuietly(persistentDmk);
    persistentDmk = null;
  }
}

function registerWalletCliDmkProcessExitHooks(): void {
  if (exitHooksRegistered) {
    return;
  }
  exitHooksRegistered = true;

  const exitAfterTeardown = (code: number) => {
    void disposeWalletCliDmkTransportFully().finally(() => {
      process.exit(code);
    });
  };

  process.once("SIGINT", () => {
    exitAfterTeardown(130);
  });
  process.once("SIGTERM", () => {
    exitAfterTeardown(143);
  });
}

let registered = false;

export function registerWalletCliDmkTransport(): void {
  if (registered) {
    return;
  }
  registered = true;

  registerWalletCliDmkProcessExitHooks();

  registerTransportModule({
    id: MODULE_ID,
    open: (id, _timeoutMs, _context, _matchDeviceByName) => {
      if (id !== WALLET_CLI_DMK_DEVICE_ID) {
        return undefined;
      }
      return ensureWalletCliDmkTransport();
    },
    disconnect: id => {
      if (id !== WALLET_CLI_DMK_DEVICE_ID) {
        return null;
      }
      return resetWalletCliDmkSession();
    },
  });
}
