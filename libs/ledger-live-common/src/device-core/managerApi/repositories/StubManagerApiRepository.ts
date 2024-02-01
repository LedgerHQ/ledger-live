import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
import { DeviceVersionEntity } from "../entities/DeviceVersionEntity";
import { FinalFirmware, OsuFirmware } from "../entities/FirmwareUpdateContextEntity";
import { LanguagePackageEntity } from "../entities/LanguagePackageEntity";
import { ManagerApiRepository } from "./ManagerApiRepository";

export class StubManagerApiRepository implements ManagerApiRepository {
  readonly fetchLatestFirmware = () => {
    const result: OsuFirmware = {
      id: 0,
      name: "",
      display_name: "",
      notes: "",
      perso: "",
      firmware: "",
      firmware_key: "",
      hash: "",
      device_versions: [],
      next_se_firmware_final_version: 0,
      providers: [],
      date_creation: "",
      date_last_modified: "",
      description: "",
      previous_se_firmware_final_version: [],
    };
    return Promise.resolve(result);
  };

  readonly fetchMcus = () => {
    return Promise.resolve([]);
  };

  readonly getDeviceVersion = () => {
    const result: DeviceVersionEntity = {
      name: "Ledger Nano S",
      device: 3,
      providers: [],
      id: 5,
      display_name: "Ledger Nano S",
      target_id: "0x31100004",
      description: "Ledger Nano S",
      mcu_versions: [1.7],
      se_firmware_final_versions: [1.2],
      osu_versions: [],
      application_versions: [],
      date_creation: "2020-04-30T13:50:00.000Z",
      date_last_modified: "2020-04-30T13:50:00.000Z",
    };
    return Promise.resolve(result);
  };

  readonly getCurrentOSU = () => {
    const result: OsuFirmware = {
      id: 0,
      name: "",
      display_name: "",
      notes: "",
      perso: "",
      firmware: "",
      firmware_key: "",
      hash: "",
      device_versions: [],
      next_se_firmware_final_version: 0,
      providers: [],
      date_creation: "",
      date_last_modified: "",
      description: "",
      previous_se_firmware_final_version: [],
    };
    return Promise.resolve(result);
  };

  readonly getCurrentFirmware = () => {
    const result: FinalFirmware = {
      id: 1,
      name: "FINAL",
      description: null,
      display_name: null,
      notes: null,
      perso: "",
      firmware: "",
      firmware_key: "",
      hash: "",
      date_creation: "",
      date_last_modified: "",
      device_versions: [],
      providers: [],
      version: "0",
      se_firmware: 1,
      osu_versions: [],
      mcu_versions: [],
      application_versions: [],
    };
    return Promise.resolve(result);
  };

  readonly getFinalFirmwareById = () => {
    const result: FinalFirmware = {
      id: 1,
      name: "FINAL",
      description: null,
      display_name: null,
      notes: null,
      perso: "",
      firmware: "",
      firmware_key: "",
      hash: "",
      date_creation: "",
      date_last_modified: "",
      device_versions: [],
      providers: [],
      version: "0",
      se_firmware: 1,
      osu_versions: [],
      mcu_versions: [],
      application_versions: [],
    };
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
