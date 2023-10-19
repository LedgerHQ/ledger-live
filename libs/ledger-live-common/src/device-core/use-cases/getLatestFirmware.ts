import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";

export async function getLatestFirmwareForDevice(deviceInfo: DeviceInfoEntity) {
  if (deviceInfo) {
    const fw = await fetchLatestFirmwareUseCase(deviceInfo);
    setLatestFirmware(fw);
  }
}
