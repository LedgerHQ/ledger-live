import type { FirmwareUpdateContext } from "@ledgerhq/types-live";

export const aLatestFirmwareContextBuilder = (
  props?: Partial<FirmwareUpdateContext>
): FirmwareUpdateContext => {
  return {
    osu: {
      next_se_firmware_final_version: 1,
      previous_se_firmware_final_version: [],
      id: 0,
      name: "OSU",
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
    },
    final: {
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
      version: "",
      se_firmware: 1,
      osu_versions: [],
      mcu_versions: [],
      application_versions: [],
    },
    shouldFlashMCU: false,
    ...props,
  };
};
