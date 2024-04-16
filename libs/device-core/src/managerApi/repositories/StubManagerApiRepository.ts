import { DeviceVersionEntity } from "../entities/DeviceVersionEntity";
import { FinalFirmware, OsuFirmware } from "../entities/FirmwareUpdateContextEntity";
import { aDeviceVersionBuilder } from "../entities/mocks/aDeviceVersion";
import { aFinalFirmwareBuilder } from "../entities/mocks/aFinalFirmware";
import { aOsuFirmwareBuilder } from "../entities/mocks/aOsuFirmware";
import { ManagerApiRepository } from "./ManagerApiRepository";

export class StubManagerApiRepository implements ManagerApiRepository {
  readonly fetchLatestFirmware = () => {
    const result: OsuFirmware = aOsuFirmwareBuilder();
    return Promise.resolve(result);
  };

  readonly fetchMcus = () => {
    return Promise.resolve([]);
  };

  readonly getDeviceVersion = () => {
    const result: DeviceVersionEntity = aDeviceVersionBuilder();
    return Promise.resolve(result);
  };

  readonly getCurrentOSU = () => {
    const result: OsuFirmware = aOsuFirmwareBuilder();
    return Promise.resolve(result);
  };

  readonly getCurrentFirmware = () => {
    const result: FinalFirmware = aFinalFirmwareBuilder();
    return Promise.resolve(result);
  };

  readonly getFinalFirmwareById = () => {
    const result: FinalFirmware = aFinalFirmwareBuilder();
    return Promise.resolve(result);
  };

  readonly getAppsByHash = () => {
    return Promise.resolve([]);
  };

  readonly catalogForDevice = () => {
    return Promise.resolve([]);
  };

  readonly getLanguagePackagesForDevice = () => {
    return Promise.resolve([]);
  };
}
