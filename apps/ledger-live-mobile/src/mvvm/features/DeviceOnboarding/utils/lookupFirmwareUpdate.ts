import { CatalogueUnreachable, type AvailableFirmwareUpdate } from "@ledgerhq/device-onboarding";
import { getLatestFirmwareForDeviceUseCase } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import { getDeviceInfoTask } from "@ledgerhq/live-common/deviceSDK/tasks/getDeviceInfo";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { filter, type Subscription } from "rxjs";

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
    if (isAbortError(error)) {
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

function readDeviceInfo(
  deviceId: string,
  deviceName: string | null,
  signal: AbortSignal,
): Promise<DeviceInfo> {
  throwIfAborted(signal);

  const deviceRead = getDeviceInfoTask({ deviceId, deviceName }).pipe(
    filter(
      (item): item is { type: "data"; deviceInfo: DeviceInfo } | FatalDeviceRead =>
        item.type === "data" || (item.type === "error" && !item.retrying),
    ),
  );

  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: Subscription | undefined;
    const finish = (settle: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      subscription?.unsubscribe();
      settle();
    };
    const onAbort = () => finish(() => reject(abortError(signal)));

    signal.addEventListener("abort", onAbort, { once: true });
    subscription = deviceRead.subscribe({
      next: event => {
        finish(() => {
          if (event.type === "error") {
            reject(event.error);
            return;
          }

          resolve(event.deviceInfo);
        });
      },
      error: error => finish(() => reject(error)),
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

type FatalDeviceRead = { type: "error"; error: Error; retrying: boolean };
