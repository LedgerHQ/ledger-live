import { ManagerApiRepository } from "./ManagerApiRepository";
import { OsuFirmware, DeviceVersionEntity, FinalFirmware } from "../types";
import { aOsuFirmwareBuilder, aDeviceVersionBuilder, aFinalFirmwareBuilder } from "../types/mocks";

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

  readonly getCurrentOsu = () => {
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
