import type { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import { getDeviceModel } from "@ledgerhq/devices";
import { toDeviceActionModelId } from "@features/platform-device-action-content";
import type { OsUpdateDevice, OsUpdateDeviceModel } from "@features/flow-device-os-update";
import {
  dmkToLedgerDeviceIdMap,
  ledgerToDmkDeviceIdMap,
  type Device as DmkDevice,
} from "@ledgerhq/live-dmk-shared";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceSymbolByModelId } from "LLM/utils/getDeviceIcon";

/** The wallet side of a DMK device model, until `@domain/entity-device-model` owns the mapping. */
export function getOsUpdateDeviceModel(modelId: DmkDeviceModelId): OsUpdateDeviceModel {
  const walletModelId = dmkToLedgerDeviceIdMap[modelId];
  return {
    productName: getDeviceModel(walletModelId).productName,
    actionModelId: toDeviceActionModelId(walletModelId),
    analyticsModelId: walletModelId,
    Icon: getDeviceSymbolByModelId(walletModelId),
  };
}

export function toOsUpdateDevice(device: DmkDevice): OsUpdateDevice {
  return {
    id: device.id,
    name: device.name,
    modelId: ledgerToDmkDeviceIdMap[device.deviceModelId],
    wired: device.transport === rnHidTransportIdentifier,
  };
}

/** The legacy device My Ledger reconnects to. */
export function toMyLedgerDevice(device: OsUpdateDevice): Device {
  return {
    deviceId: device.id,
    deviceName: device.name,
    modelId: dmkToLedgerDeviceIdMap[device.modelId],
    wired: device.wired,
  };
}

/** The DMK route device the OS update screen is opened with. */
export function toDmkDevice(device: Device): DmkDevice {
  return {
    id: device.deviceId,
    name: device.deviceName ?? null,
    deviceModelId: device.modelId,
    transport: device.wired ? rnHidTransportIdentifier : rnBleTransportIdentifier,
  };
}
