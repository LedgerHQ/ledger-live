import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";

export const dmkToLedgerDeviceIdMap: Record<DMKDeviceModelId, LLDeviceModelId> = {
  [DMKDeviceModelId.FLEX]: LLDeviceModelId.europa,
  [DMKDeviceModelId.STAX]: LLDeviceModelId.stax,
  [DMKDeviceModelId.NANO_SP]: LLDeviceModelId.nanoSP,
  [DMKDeviceModelId.NANO_S]: LLDeviceModelId.nanoS,
  [DMKDeviceModelId.NANO_X]: LLDeviceModelId.nanoX,
  [DMKDeviceModelId.APEX]: LLDeviceModelId.apex,
};

export const ledgerToDmkDeviceIdMap = Object.fromEntries(
  Object.entries(dmkToLedgerDeviceIdMap).map(([dmkDeviceId, ledgerDeviceId]) => [
    ledgerDeviceId,
    dmkDeviceId,
  ]),
);
