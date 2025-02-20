import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";

export const deviceIdMap = {
  blue: LLDeviceModelId.blue,
  [DMKDeviceModelId.FLEX]: LLDeviceModelId.europa,
  [DMKDeviceModelId.STAX]: LLDeviceModelId.stax,
  [DMKDeviceModelId.NANO_SP]: LLDeviceModelId.nanoSP,
  [DMKDeviceModelId.NANO_S]: LLDeviceModelId.nanoS,
  [DMKDeviceModelId.NANO_X]: LLDeviceModelId.nanoX,
};
