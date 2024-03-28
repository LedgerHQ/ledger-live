import { DeviceVersionEntity } from "../DeviceVersionEntity";

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
