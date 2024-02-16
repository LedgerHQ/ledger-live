import { DeviceInfo, DeviceVersionEntity, FinalFirmware, OsuFirmware } from ".";

export const aDeviceInfoBuilder = (props?: Partial<DeviceInfo>): DeviceInfo => {
  return {
    mcuVersion: "A_MCU_VERSION",
    version: "A_VERSION",
    majMin: "A_MAJ_MIN",
    targetId: "0.0",
    isBootloader: false,
    isOSU: true,
    providerName: undefined,
    managerAllowed: false,
    pinValidated: true,
    ...props,
  };
};

export const aDeviceVersionBuilder = (
  props?: Partial<DeviceVersionEntity>,
): DeviceVersionEntity => {
  return {
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
    ...props,
  };
};

export const aFinalFirmwareBuilder = (props?: Partial<FinalFirmware>): FinalFirmware => {
  return {
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
    ...props,
  };
};

export function aOsuFirmwareBuilder(props?: Partial<OsuFirmware>) {
  return {
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
    ...props,
  };
}
