import { DeviceModelId, type ConnectedDevice } from "@ledgerhq/device-management-kit";

export const stax = {
  id: "device-id",
  name: "Ledger Stax",
  modelId: DeviceModelId.STAX,
  sessionId: "session-id",
  type: "BLE",
  transport: "ble",
} as ConnectedDevice;
