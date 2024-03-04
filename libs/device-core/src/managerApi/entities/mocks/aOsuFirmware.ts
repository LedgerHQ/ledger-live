import { OsuFirmware } from "../FirmwareUpdateContextEntity";

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
