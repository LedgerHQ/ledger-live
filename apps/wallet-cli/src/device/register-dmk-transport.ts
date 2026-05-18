import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { firstValueFrom } from "rxjs";
import { filter, timeout } from "rxjs/operators";
import { WalletCliDmkTransport } from "./wallet-cli-dmk-transport";
import type { WalletCliDmk } from "./dmk";
import {
  hasWalletCliDeviceInterruptScope,
  withWalletCliDeviceInterruptScope,
} from "./interrupt-scope";
import { restoreTerminalCursor } from "../shared/ui";

/** Device id passed to live-common `withDevice` / bridge methods for the first USB Ledger (DMK node WebUSB). */
export const WALLET_CLI_DMK_DEVICE_ID = "wallet-cli-dmk";

const CONNECT_TIMEOUT_MS = 60_000;

/**
 * Bound on the dispose-time `dmk.disconnect`: under SIGINT / process exit the
 * native USB transport may be parked in an unreturnable transferIn, so we cap
 * the wait rather than skipping the call entirely.
 */
const DISPOSE_DISCONNECT_TIMEOUT_MS = 1_000;
const DISPOSE_DESTROY_TIMEOUT_MS = 1_000;

const MODULE_ID = "wallet-cli-dmk-webusb";

type Singleton = {
  dmk: DeviceManagementKit;
  transport: WalletCliDmkTransport;
  destroyTransport: () => Promise<void>;
};

let singleton: Singleton | null = null;
/** One DMK per CLI process: each `createDeviceManagementKit()` adds node-usb hotplug listeners; closing + recreating stacks listeners and breaks the 3rd+ in-process connect (same pattern as the former node-hid kit). */
let persistentDmk: Promise<WalletCliDmk> | null = null;
let exitHooksRegistered = false;

let _testTransport: WalletCliDmkTransport | null = null;

/** @internal Test seam — install before the CLI starts (e.g. from dmk-intercept.ts) to bypass USB discovery. */
export function _setTestDmkTransport(t: WalletCliDmkTransport | null): void {
  _testTransport = t;
  singleton = null;
}

function closeDmkQuietly(dmk: DeviceManagementKit): void {
  try {
    dmk.close();
  } catch {
    // close() may throw if the transport is already torn down
  }
}

function terminateWalletCliFromSignal(code: number): void {
  // yocto-spinner hides the cursor while spinning; force-killing the process below
  // skips its normal cleanup, so explicitly restore the cursor first.
  restoreTerminalCursor();
  process.exitCode = code;
  if ("bun" in process.versions) {
    process.kill(process.pid, "SIGKILL");
    return;
  }
  process.exit(code);
}

function getOrCreatePersistentDmk(): Promise<WalletCliDmk> {
  return (persistentDmk ??= import("./dmk")
    .then(({ createDeviceManagementKit }) => createDeviceManagementKit())
    .catch(error => {
      persistentDmk = null;
      throw error;
    }));
}

/**
 * Race the supplied promise against a timeout, swallowing both the resolution
 * and the error. At process exit, a wedged USB transferIn must not be allowed
 * to keep us alive.
 */
async function awaitWithTimeout(work: Promise<unknown>, timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<void>(resolve => {
    timer = setTimeout(resolve, timeoutMs);
  });
  try {
    await Promise.race([work.then(() => undefined).catch(() => undefined), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function disconnectHeldDmk(held: Singleton | null, mode: "reset" | "dispose"): Promise<void> {
  if (!held) return;

  const disconnect = held.dmk.disconnect({ sessionId: held.transport.sessionId });
  if (mode === "reset" || _testTransport) {
    await disconnect.catch(() => {});
    return;
  }

  await awaitWithTimeout(disconnect, DISPOSE_DISCONNECT_TIMEOUT_MS);
}

async function destroyHeldDmk(held: Singleton | null): Promise<void> {
  if (!held) return;

  await awaitWithTimeout(held.destroyTransport(), DISPOSE_DESTROY_TIMEOUT_MS);
  closeDmkQuietly(held.dmk);
}

async function destroyPersistentDmk(
  kit: WalletCliDmk | null,
  mode: "reset" | "dispose",
): Promise<void> {
  if (!kit) return;

  if (mode === "reset") {
    await kit.destroyTransport().catch(() => {});
  } else {
    await awaitWithTimeout(kit.destroyTransport(), DISPOSE_DESTROY_TIMEOUT_MS);
  }
  closeDmkQuietly(kit.dmk);
}

async function teardownPersistentDmk(
  held: Singleton | null,
  mode: "reset" | "dispose",
): Promise<void> {
  if (!persistentDmk) return;

  const kit = await persistentDmk.catch(() => null);
  if (held) {
    // The persistent kit was the one held; closeDmkQuietly above already closed it.
    // Drop the ref so the next ensure() rebuilds.
    if (kit?.dmk === held.dmk) persistentDmk = null;
    return;
  }

  // No singleton owned the persistent kit. Close it in both reset and dispose
  // so hotplug listeners cannot keep the process alive after a failed connect.
  await destroyPersistentDmk(kit, mode);
  persistentDmk = null;
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
  const sessionId = await dmk.connect({
    device,
    sessionRefresherOptions: { isRefresherDisabled: true },
  });

  const sessionState = await firstValueFrom(dmk.getDeviceSessionState({ sessionId })).catch(
    () => null,
  );
  const status =
    sessionState && typeof sessionState === "object" && "deviceStatus" in sessionState
      ? sessionState.deviceStatus
      : null;

  const { DeviceStatus } = await import("@ledgerhq/device-management-kit");
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
 * The session refresher is disabled in wallet-cli: short-lived command sessions otherwise race
 * refresher APDUs against explicit disconnect/reopen cycles. If the initial session state is BUSY
 * we disconnect and ask the user to retry.
 */
export function ensureWalletCliDmkTransport(): Promise<WalletCliDmkTransport> {
  return withWalletCliDeviceInterruptScope(async () => {
    if (_testTransport) {
      singleton ??= {
        dmk: _testTransport.dmk,
        transport: _testTransport,
        destroyTransport: async () => {},
      };
      return singleton.transport;
    }

    if (singleton) {
      return singleton.transport;
    }

    const kit = await getOrCreatePersistentDmk();
    const sessionId = await connectFirstUsbDevice(kit.dmk);
    const transport = new WalletCliDmkTransport(kit.dmk, sessionId);
    singleton = { dmk: kit.dmk, transport, destroyTransport: kit.destroyTransport };
    return transport;
  });
}

/**
 * Reset: drops the active USB session and tears down DMK/native USB state before the next open.
 * Dispose: same teardown — used at process exit. The DMK disconnect is bounded by
 * {@link DISPOSE_DISCONNECT_TIMEOUT_MS} because the native USB transport may be wedged
 * (e.g. a parked transferIn after SIGINT) and would otherwise keep the process alive.
 */
async function teardownDmk(mode: "reset" | "dispose"): Promise<void> {
  const held = singleton;
  singleton = null;

  await disconnectHeldDmk(held, mode);

  if (_testTransport) return;

  await destroyHeldDmk(held);
  await teardownPersistentDmk(held, mode);
}

export const resetWalletCliDmkSession = (): Promise<void> => teardownDmk("reset");

/**
 * Returns the live-common DeviceModelId for the active DMK session, or undefined if unavailable.
 * Must be called while a session is active (inside a withCurrencyDeviceSession callback).
 */
export async function getWalletCliDeviceModelId(): Promise<DeviceModelId | undefined> {
  if (!singleton) return undefined;
  const { dmk, transport } = singleton;
  const state = await firstValueFrom(
    dmk.getDeviceSessionState({ sessionId: transport.sessionId }),
  ).catch(() => null);
  if (!state?.deviceModelId) return undefined;
  return dmkToLedgerDeviceIdMap[state.deviceModelId];
}

/**
 * Process-exit teardown: best-effort `dmk.disconnect` (capped by
 * {@link DISPOSE_DISCONNECT_TIMEOUT_MS}), destroy the node-webusb transport,
 * then `dmk.close()` the persistent kit so the node-usb hotplug listeners
 * stop holding the event loop open.
 */
export const disposeWalletCliDmkTransportFully = (): Promise<void> => teardownDmk("dispose");

function registerWalletCliDmkProcessExitHooks(): void {
  if (exitHooksRegistered) {
    return;
  }
  exitHooksRegistered = true;

  // process.once: a second Ctrl+C during teardown removes our listener and
  // falls back to Node's default SIGINT behaviour (force-exit), so we don't
  // need a re-entrancy guard here.
  const exitAfterTeardown = (_signal: NodeJS.Signals, code: number) => {
    // Avoid graceful USB teardown while a native transfer may be parked.
    if (hasWalletCliDeviceInterruptScope()) {
      terminateWalletCliFromSignal(code);
      return;
    }
    void (async () => {
      await disposeWalletCliDmkTransportFully();
      terminateWalletCliFromSignal(code);
    })().catch(() => {
      terminateWalletCliFromSignal(code);
    });
  };

  process.once("SIGINT", () => {
    exitAfterTeardown("SIGINT", 130);
  });
  process.once("SIGTERM", () => {
    exitAfterTeardown("SIGTERM", 143);
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
