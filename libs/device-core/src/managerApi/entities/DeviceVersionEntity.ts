import { Id } from "./Id";

export type DeviceVersionEntity = {
  id: Id;
  name: string;
  display_name: string;
  target_id: string;
  description: string;
  device: Id;
  providers: Array<Id>;
  mcu_versions: Array<Id>;
  se_firmware_final_versions: Array<Id>;
  osu_versions: Array<Id>;
  application_versions: Array<Id>;
  date_creation: string;
  date_last_modified: string;
};
