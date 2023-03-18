import { createAction } from "redux-actions";
import type {
  BleImportBlePayload,
  BleAddKnownDevicePayload,
  BleRemoveKnownDevicePayload,
  BleRemoveKnownDevicesPayload,
  BleSaveDeviceNamePayload,
} from "./types";
import { BleActionTypes } from "./types";

export const removeKnownDevice = createAction<BleRemoveKnownDevicePayload>(
  BleActionTypes.BLE_REMOVE_DEVICE,
);
export const removeKnownDevices = createAction<BleRemoveKnownDevicesPayload>(
  BleActionTypes.BLE_REMOVE_DEVICES,
);
export const addKnownDevice = createAction<BleAddKnownDevicePayload>(
  BleActionTypes.BLE_ADD_DEVICE,
);
export const importBle = createAction<BleImportBlePayload>(
  BleActionTypes.BLE_IMPORT,
);
export const saveBleDeviceName = createAction<BleSaveDeviceNamePayload>(
  BleActionTypes.BLE_SAVE_DEVICE_NAME,
);
