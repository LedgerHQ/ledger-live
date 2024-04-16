import { Id } from "./Id";

type BaseFirmware = {
  id: Id;
  name: string;
  description: string | null | undefined;
  display_name: string | null | undefined;
  notes: string | null | undefined;
  perso: string;
  firmware: string;
  firmware_key: string;
  hash: string;
  date_creation: string;
  date_last_modified: string;
  device_versions: Array<Id>;
  providers: Array<Id>;
};

/**
 *
 */
export type OsuFirmware = BaseFirmware & {
  next_se_firmware_final_version: Id;
  previous_se_firmware_final_version: Array<Id>;
};

/**
 *
 */
export type FinalFirmware = BaseFirmware & {
  version: string;
  se_firmware: Id;
  osu_versions: Array<OsuFirmware>;
  mcu_versions: Array<Id>;
  application_versions: Array<Id>;
  bytes?: number;
  updateAvailable?: FirmwareUpdateContextEntity | null | undefined;
};

export type FirmwareUpdateContextEntity = {
  osu: OsuFirmware;
  final: FinalFirmware;
  shouldFlashMCU: boolean;
};
