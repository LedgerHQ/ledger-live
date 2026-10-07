import { CatalogueUnreachable, type AvailableFirmwareUpdate } from "@ledgerhq/device-onboarding";
import { getLatestFirmwareForDeviceUseCase } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import { getDeviceInfoTask } from "@ledgerhq/live-common/deviceSDK/tasks/getDeviceInfo";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { filter, firstValueFrom } from "rxjs";

export async function lookupFirmwareUpdate(
  deviceId: string,
  deviceName: string | null,
): Promise<AvailableFirmwareUpdate | null> {
  const deviceInfo = await readDeviceInfo(deviceId, deviceName);

  try {
    const context = await getLatestFirmwareForDeviceUseCase(deviceInfo);

    return context === null || context === undefined ? null : toAvailableFirmwareUpdate(context);
  } catch (error) {
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

async function readDeviceInfo(deviceId: string, deviceName: string | null): Promise<DeviceInfo> {
  const event = await firstValueFrom(
    getDeviceInfoTask({ deviceId, deviceName }).pipe(
      filter(
        (item): item is { type: "data"; deviceInfo: DeviceInfo } | FatalDeviceRead =>
          item.type === "data" || (item.type === "error" && !item.retrying),
      ),
    ),
  );

  if (event.type === "error") {
    throw event.error;
  }

  return event.deviceInfo;
}

type FatalDeviceRead = { type: "error"; error: Error; retrying: boolean };
