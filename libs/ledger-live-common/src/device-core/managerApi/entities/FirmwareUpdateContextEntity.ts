import { IdEntity } from "./IdEntity";

type BaseFirmware = {
  id: IdEntity;
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
  device_versions: Array<IdEntity>;
  providers: Array<IdEntity>;
};

/**
 *
 */
export type OsuFirmware = BaseFirmware & {
  next_se_firmware_final_version: IdEntity;
  previous_se_firmware_final_version: Array<IdEntity>;
};

/**
 *
 */
export type FinalFirmware = BaseFirmware & {
  version: string;
  se_firmware: IdEntity;
  osu_versions: Array<OsuFirmware>;
  mcu_versions: Array<IdEntity>;
  application_versions: Array<IdEntity>;
  bytes?: number;
  updateAvailable?: FirmwareUpdateContextEntity | null | undefined;
};

export type FirmwareUpdateContextEntity = {
  osu: OsuFirmware;
  final: FinalFirmware;
  shouldFlashMCU: boolean;
};
