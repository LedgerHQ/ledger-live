import { UnknownMCU } from "@ledgerhq/errors";
import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
import { FirmwareUpdateContextEntity } from "../entities/FirmwareUpdateContextEntity";
import { ManagerApiRepository } from "../repositories/ManagerApiRepository";

type GetLatestFirmwareForDeviceParams = {
  deviceInfo: DeviceInfoEntity;
  providerId: number;
  userId: string;
  managerApiRepository: ManagerApiRepository;
};

export async function getLatestFirmwareForDevice({
  deviceInfo,
  providerId,
  userId,
  managerApiRepository,
}: GetLatestFirmwareForDeviceParams): Promise<FirmwareUpdateContextEntity | null> {
  const mcusPromise = managerApiRepository.fetchMcus();

  // Gets device infos from targetId
  const deviceVersion = await managerApiRepository.getDeviceVersion({
    targetId: deviceInfo.targetId,
    providerId,
  });
  let osu;

  if (deviceInfo.isOSU) {
    osu = await managerApiRepository.getCurrentOSU({
      deviceId: deviceVersion.id,
      providerId,
      version: deviceInfo.version,
    });
  } else {
    // Gets firmware infos with firmware name and device version
    const seFirmwareVersion = await managerApiRepository.getCurrentFirmware({
      version: deviceInfo.version,
      deviceId: deviceVersion.id,
      providerId,
    });
    // Fetches next possible firmware
    osu = await managerApiRepository.fetchLatestFirmware({
      current_se_firmware_final_version: seFirmwareVersion.id,
      device_version: deviceVersion.id,
      userId,
      providerId,
    });
  }

  if (!osu) {
    return null;
  }

  const mcus = await mcusPromise;
  const currentMcuVersion = mcus.find(mcu => mcu.name === deviceInfo.mcuVersion);

  if (!currentMcuVersion) throw new UnknownMCU();

  const final = await managerApiRepository.getFinalFirmwareById(osu.next_se_firmware_final_version);
  const shouldFlashMCU = !final.mcu_versions.includes(currentMcuVersion.id);
  return {
    final,
    osu,
    shouldFlashMCU,
  };
}
