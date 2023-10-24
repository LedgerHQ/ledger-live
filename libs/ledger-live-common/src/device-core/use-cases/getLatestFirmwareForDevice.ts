import { UnknownMCU } from "@ledgerhq/errors";
import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
import { FirmwareUpdateContextEntity } from "../entities/FirmwareUpdateContextEntity";
import { fetchLatestFirmware } from "./managerApi/fetchLatestFirmware";
import { fetchMcus } from "./managerApi/fetchMcus";

type GetLatestFirmwareForDeviceParams = {
  deviceInfo: DeviceInfoEntity;
  providerId: number;
  userId: string;
  managerApiBase: string;
  liveCommonVersion: string;
};

export default async function getLatestFirmwareForDevice({
  deviceInfo,
  providerId,
  userId,
  managerApiBase,
  liveCommonVersion,
}: GetLatestFirmwareForDeviceParams): Promise<FirmwareUpdateContextEntity | null> {
  const mcusPromise = fetchMcus({ managerApiBase, liveCommonVersion });
  // Gets device infos from targetId
  const deviceVersion = await ManagerAPI.getDeviceVersion(deviceInfo.targetId, providerId);
  let osu;

  if (deviceInfo.isOSU) {
    osu = await ManagerAPI.getCurrentOSU({
      deviceId: deviceVersion.id,
      provider: providerId,
      version: deviceInfo.version,
    });
  } else {
    // Gets firmware infos with firmware name and device version
    const seFirmwareVersion = await ManagerAPI.getCurrentFirmware({
      version: deviceInfo.version,
      deviceId: deviceVersion.id,
      provider: providerId,
    });
    // Fetches next possible firmware
    osu = await fetchLatestFirmware({
      current_se_firmware_final_version: seFirmwareVersion.id,
      device_version: deviceVersion.id,
      managerApiBase,
      userId,
      providerId,
      liveCommonVersion,
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
}
