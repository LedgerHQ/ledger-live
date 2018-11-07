// @flow
import type Transport from "@ledgerhq/hw-transport";
import type {
  DeviceInfo,
  DeviceVersion,
  OsuFirmware,
  FinalFirmware,
} from "../../types/manager";
import ManagerAPI from "../../api/Manager";
import getDeviceInfo from "./getDeviceInfo";

export default async (transport: Transport<*>): Promise<void> => {
  try {
    const deviceInfo: DeviceInfo = await getDeviceInfo(transport);
    const device: DeviceVersion = await ManagerAPI.getDeviceVersion(
      deviceInfo.targetId,
      deviceInfo.providerId,
    );
    const firmware: OsuFirmware = await ManagerAPI.getCurrentOSU({
      deviceId: device.id,
      version: deviceInfo.fullVersion,
      provider: deviceInfo.providerId,
    });
    const { next_se_firmware_final_version } = firmware; // eslint-disable-line
    const nextFirmware: FinalFirmware = await ManagerAPI.getFinalFirmwareById(
      next_se_firmware_final_version,
    );
    await ManagerAPI.install(transport, "firmware", {
      targetId: deviceInfo.targetId,
      ...nextFirmware,
      firmwareKey: nextFirmware.firmware_key,
    }).toPromise();
  } catch (error) {
    throw error;
  }
};
