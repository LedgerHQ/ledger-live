import { FinalFirmware } from "../FirmwareUpdateContextEntity";

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
