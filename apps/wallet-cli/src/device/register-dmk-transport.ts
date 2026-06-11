import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { firstValueFrom } from "rxjs";
import { filter, timeout } from "rxjs/operators";
import { WalletCliDmkTransport } from "./wallet-cli-dmk-transport";
import type { WalletCliDmk } from "./dmk";
import {
  explicitTransportKind,
  markBleInitialized,
  type WalletCliTransportKind,
} from "./transport-kind";
import {
  deviceMatchesSelector,
  resolveDeviceSelector,
  selectDiscoveredDevice,
} from "./device-selector";
import {
  hasWalletCliDeviceInterruptScope,
  withWalletCliDeviceInterruptScope,
} from "./interrupt-scope";
import { restoreTerminalCursor } from "../shared/ui";

/** Device id passed to live-common `withDevice` / bridge methods for the first discovered Ledger (DMK node WebUSB or node BLE, per WALLET_CLI_TRANSPORT). */
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

function getOrCreatePersistentDmk(kind: WalletCliTransportKind): Promise<WalletCliDmk> {
  return (persistentDmk ??= import("./dmk")
    .then(({ createDeviceManagementKit }) => createDeviceManagementKit(kind))
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

/** How long `devices` scans before reporting what it found (BLE advertises over time). */
const DEVICE_SCAN_MS = 4_000;

export type ListedDevice = {
  readonly id: string;
  readonly name: string;
  readonly model: string;
  readonly transport: string;
};

/** Transports the `devices` command sweeps to show every reachable Ledger at once. */
const LISTABLE_TRANSPORTS: WalletCliTransportKind[] = ["usb", "ble"];

/** Scan one transport with a throwaway kit; return [] if that transport is unavailable. */
async function scanTransportForDevices(
  kind: WalletCliTransportKind,
  scanMs: number,
): Promise<ListedDevice[]> {
  const { createDeviceManagementKit } = await import("./dmk");
  let kit: WalletCliDmk;
  try {
    // BLE pulls in the optional noble native binding; USB the usb addon. If a
    // transport can't initialize on this host, skip it rather than failing the
    // whole listing.
    kit = await createDeviceManagementKit(kind);
  } catch {
    return [];
  }
  if (kind === "ble") {
    // noble is now loaded; the process must exit explicitly at the end (see cli.ts).
    markBleInitialized();
  }
  const byId = new Map<string, DiscoveredDevice>();
  const subscription = kit.dmk.listenToAvailableDevices({}).subscribe({
    next: (list: DiscoveredDevice[]) => {
      for (const device of list) {
        byId.set(device.id, device);
      }
    },
    error: () => {},
  });
  try {
    await new Promise<void>(resolve => setTimeout(resolve, scanMs));
  } finally {
    subscription.unsubscribe();
    try {
      await kit.destroyTransport();
    } catch {
      // best-effort teardown of the throwaway kit
    }
    closeDmkQuietly(kit.dmk);
  }
  return [...byId.values()].map(device => ({
    id: device.id,
    // DiscoveredDevice.name is typed as required but can be empty/missing in
    // practice; default to "" so ListedDevice.name stays a string.
    name: device.name ?? "",
    // DeviceModel.model is the model enum ("flex"/"stax"/…); .id is the runtime
    // device id (same value as device.id), so use .model for a human label.
    model: String((device.deviceModel as { model?: unknown } | undefined)?.model ?? ""),
    transport: kind,
  }));
}

/**
 * Scan all transports (USB and BLE) for reachable Ledger devices and return them,
 * without connecting or signing. Read-only: backs the `devices` command so the
 * user can see every reachable Ledger — with its transport — and the names/ids to
 * pass to --device. Transports that can't initialize on this host are skipped.
 */
export async function listWalletCliDevices(scanMs: number = DEVICE_SCAN_MS): Promise<ListedDevice[]> {
  return withWalletCliDeviceInterruptScope(async () => {
    const perTransport = await Promise.all(
      LISTABLE_TRANSPORTS.map(kind => scanTransportForDevices(kind, scanMs)),
    );
    return perTransport.flat();
  });
}

function describeListed(devices: readonly ListedDevice[]): string {
  return devices.map(d => `${d.name || "(unnamed)"} [${d.transport} ${d.id}]`).join(", ");
}

/**
 * Pure decision: pick the transport to connect over from the scanned devices.
 * Exported for tests — `resolveTransportForConnect` wraps it with the live scan.
 * - With a selector: require it to match devices on exactly one transport.
 * - Without one: use the only reachable device, else refuse and list candidates.
 */
export function chooseConnectTransport(
  found: readonly ListedDevice[],
  selector: string | null,
): WalletCliTransportKind {
  if (selector) {
    const matches = found.filter(device => deviceMatchesSelector(device, selector));
    if (matches.length === 0) {
      throw new Error(
        `No Ledger device matching "${selector}". Discovered: ${describeListed(found) || "none"}. ` +
          "Run `devices` to list reachable Ledgers.",
      );
    }
    const transports = new Set(matches.map(match => match.transport));
    if (transports.size > 1) {
      throw new Error(
        `"${selector}" matches devices on multiple transports: ${describeListed(matches)}. ` +
          "Use a more specific id.",
      );
    }
    return [...transports][0] as WalletCliTransportKind;
  }
  if (found.length === 0) {
    throw new Error("No Ledger device found. Unlock the device and try again.");
  }
  if (found.length === 1) {
    return found[0]!.transport as WalletCliTransportKind;
  }
  throw new Error(
    `Multiple Ledger devices found: ${describeListed(found)}. ` +
      "Choose one with --device <name|id> (or WALLET_CLI_TRANSPORT).",
  );
}

/**
 * Decide which transport to connect over, WITHOUT requiring WALLET_CLI_TRANSPORT:
 * honor it if set, else infer from the chosen device by scanning all transports
 * (so `--device <id|name>` works without naming the transport — the scan already
 * knows which device is on USB vs BLE). The connect step re-applies the selector
 * on the chosen transport, so a per-session USB id never has to survive across
 * the scan→connect boundary (name / BLE id do).
 */
async function resolveTransportForConnect(selector: string | null): Promise<WalletCliTransportKind> {
  const explicit = explicitTransportKind();
  if (explicit) {
    return explicit;
  }
  return chooseConnectTransport(await listWalletCliDevices(), selector);
}

async function connectSelectedDevice(dmk: DeviceManagementKit): Promise<string> {
  const selector = resolveDeviceSelector();
  // With a selector, wait until a device matching WALLET_CLI_DEVICE shows up
  // (a target device may advertise after others over BLE). Without one, take the
  // first non-empty discovery snapshot. selectDiscoveredDevice then enforces a
  // single unambiguous choice, so we never silently connect to the wrong wallet.
  const discovered = await firstValueFrom(
    dmk.listenToAvailableDevices({}).pipe(
      filter((list: DiscoveredDevice[]) =>
        selector
          ? list.some(device => deviceMatchesSelector(device, selector))
          : list.length > 0,
      ),
      timeout(CONNECT_TIMEOUT_MS),
    ),
  );
  const device = selectDiscoveredDevice(discovered, selector);
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

    const selector = resolveDeviceSelector();
    const kind = await resolveTransportForConnect(selector);
    if (kind === "ble") {
      markBleInitialized();
    }
    const kit = await getOrCreatePersistentDmk(kind);
    const sessionId = await connectSelectedDevice(kit.dmk);
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
