import { CatalogueUnreachable, type AvailableFirmwareUpdate } from "@ledgerhq/device-onboarding";
import { getLatestFirmwareForDeviceUseCase } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import { getDeviceInfoTask } from "@ledgerhq/live-common/deviceSDK/tasks/getDeviceInfo";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { type Subscription } from "rxjs";

const unresponsiveDeviceReadMs = 30_000;

let previousDeviceRead: Promise<void> = Promise.resolve();

export async function lookupFirmwareUpdate(
  deviceId: string,
  deviceName: string | null,
  signal: AbortSignal,
): Promise<AvailableFirmwareUpdate | null> {
  const deviceInfo = await readDeviceInfo(deviceId, deviceName, signal);

  try {
    const context = await untilAborted(getLatestFirmwareForDeviceUseCase(deviceInfo), signal);

    return context === null || context === undefined ? null : toAvailableFirmwareUpdate(context);
  } catch (error) {
    if (isAbortError(error) || !isRetryableCatalogueError(error)) {
      throw error;
    }

    throw new CatalogueUnreachable(error);
  }
}

function toAvailableFirmwareUpdate(context: FirmwareUpdateContext): AvailableFirmwareUpdate {
  return {
    mcuUpdateRequired: context.shouldFlashMCU,
    finalFirmware: {
      id: context.final.id,
      version: context.final.version,
      perso: context.final.perso,
      firmware: context.final.firmware,
      firmwareKey: context.final.firmware_key,
      hash: context.final.hash,
      bytes: context.final.bytes ?? null,
      mcuVersions: context.final.mcu_versions,
    },
    osuFirmware: {
      id: context.osu.id,
      notes: context.osu.notes ?? null,
      perso: context.osu.perso,
      firmware: context.osu.firmware,
      firmwareKey: context.osu.firmware_key,
      hash: context.osu.hash,
      nextFinalFirmware: context.osu.next_se_firmware_final_version,
    },
  };
}

async function readDeviceInfo(
  deviceId: string,
  deviceName: string | null,
  signal: AbortSignal,
): Promise<DeviceInfo> {
  throwIfAborted(signal);

  const waitForPreviousRead = previousDeviceRead;
  let releasePreviousRead: () => void = () => undefined;
  previousDeviceRead = new Promise(resolve => {
    releasePreviousRead = resolve;
  });

  try {
    await waitForPreviousRead;
    throwIfAborted(signal);

    return await subscribeToDeviceRead(deviceId, deviceName, signal);
  } finally {
    releasePreviousRead();
  }
}

function subscribeToDeviceRead(
  deviceId: string,
  deviceName: string | null,
  signal: AbortSignal,
): Promise<DeviceInfo> {
  throwIfAborted(signal);

  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: Subscription | undefined;
    let unresponsiveDeadline: ReturnType<typeof setTimeout> | undefined;
    const finish = (settle: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      if (unresponsiveDeadline !== undefined) clearTimeout(unresponsiveDeadline);
      subscription?.unsubscribe();
      settle();
    };
    const onAbort = () => finish(() => reject(abortError(signal)));
    const waitForDeviceResponse = (error: Error) => {
      if (unresponsiveDeadline !== undefined) return;
      unresponsiveDeadline = setTimeout(
        () => finish(() => reject(error)),
        unresponsiveDeviceReadMs,
      );
    };

    signal.addEventListener("abort", onAbort, { once: true });
    subscription = getDeviceInfoTask({ deviceId, deviceName }).subscribe({
      next: event => {
        if (event.type === "data") {
          finish(() => resolve(event.deviceInfo));
          return;
        }

        if (event.type !== "error") {
          finish(() => reject(new Error("device read failed")));
          return;
        }

        if (event.retrying && event.error.name === "UnresponsiveDeviceError") {
          waitForDeviceResponse(event.error);
          return;
        }

        finish(() => reject(event.error));
      },
      error: error => finish(() => reject(error)),
      complete: () => finish(() => reject(new Error("device read ended"))),
    });

    if (signal.aborted) onAbort();
  });
}

function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  throwIfAborted(signal);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (settle: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      settle();
    };
    const onAbort = () => finish(() => reject(abortError(signal)));

    signal.addEventListener("abort", onAbort, { once: true });
    work.then(
      value => finish(() => resolve(value)),
      error => finish(() => reject(error)),
    );
  });
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw abortError(signal);
}

function abortError(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) return signal.reason;

  const error = new Error("firmware lookup cancelled");
  error.name = "AbortError";
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isRetryableCatalogueError(error: unknown): boolean {
  return error instanceof Error && (error.name === "NetworkDown" || error.name === "LedgerAPI5xx");
}
