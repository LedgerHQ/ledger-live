import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
import { FirmwareUpdateContextEntity } from "../entities/FirmwareUpdateContextEntity";

export default async function getLatestFirmwareForDevice(
  deviceInfo: DeviceInfoEntity,
  providerId: number,
): Promise<FirmwareUpdateContextEntity | null> {
  const mcusPromise = ManagerAPI.getMcus();
  // Get device infos from targetId
  const deviceVersion = await ManagerAPI.getDeviceVersion(
    deviceInfo.targetId,
    providerId,
  );
  let osu;

  if (deviceInfo.isOSU) {
    osu = await ManagerAPI.getCurrentOSU({
      deviceId: deviceVersion.id,
      provider: providerId,
      version: deviceInfo.version,
    });
  } else {
    // Get firmware infos with firmware name and device version
    const seFirmwareVersion = await ManagerAPI.getCurrentFirmware({
      version: deviceInfo.version,
      deviceId: deviceVersion.id,
      provider: providerId,
    });
    // Fetch next possible firmware
    osu = await ManagerAPI.getLatestFirmware({
      current_se_firmware_final_version: seFirmwareVersion.id,
      device_version: deviceVersion.id,
      provider: providerId,
    });
  }

  if (!osu) {
    return null;
  }

  const final = await ManagerAPI.getFinalFirmwareById(osu.next_se_firmware_final_version);
  const mcus = await mcusPromise;
  const currentMcuVersion = mcus.find(mcu => mcu.name === deviceInfo.mcuVersion);
  if (!currentMcuVersion) throw new UnknownMCU();
  const shouldFlashMCU = !final.mcu_versions.includes(currentMcuVersion.id);
  return {
    final,
    osu,
    shouldFlashMCU,
  };
};
