import { IdEntity } from "./IdEntity";

export type DeviceVersionEntity = {
  id: IdEntity;
  name: string;
  display_name: string;
  target_id: string;
  description: string;
  device: IdEntity;
  providers: Array<IdEntity>;
  mcu_versions: Array<IdEntity>;
  se_firmware_final_versions: Array<IdEntity>;
  osu_versions: Array<IdEntity>;
  application_versions: Array<IdEntity>;
  date_creation: string;
  date_last_modified: string;
};
