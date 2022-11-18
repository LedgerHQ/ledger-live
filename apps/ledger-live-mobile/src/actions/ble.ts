import { createAction } from "redux-actions";
import type { BleState, DeviceLike } from "../reducers/types";
import type {
  BleImportBlePayload,
  BleAddKnownDevicePayload,
  BleRemoveKnownDevicePayload,
  BleRemoveKnownDevicesPayload,
  BleSaveDeviceNamePayload,
} from "./types";
import { BleActionTypes } from "./types";

const removeKnownDeviceAction = createAction<BleRemoveKnownDevicePayload>(
  BleActionTypes.BLE_REMOVE_DEVICE,
);
export const removeKnownDevice = (deviceId: string) =>
  removeKnownDeviceAction({
    deviceId,
  });

const removeKnownDevicesAction = createAction<BleRemoveKnownDevicesPayload>(
  BleActionTypes.BLE_REMOVE_DEVICES,
);
export const removeKnownDevices = (ids: string[]) =>
  removeKnownDevicesAction({
    ids,
  });

const addKnownDeviceAction = createAction<BleAddKnownDevicePayload>(
  BleActionTypes.BLE_ADD_DEVICE,
);
export const addKnownDevice = (device: DeviceLike) =>
  addKnownDeviceAction({
    device,
  });

const importBleAction = createAction<BleImportBlePayload>(
  BleActionTypes.BLE_IMPORT,
);
export const importBle = (ble: BleState) => importBleAction(ble);

const saveBleDeviceNameAction = createAction<BleSaveDeviceNamePayload>(
  BleActionTypes.BLE_SAVE_DEVICE_NAME,
);
export const saveBleDeviceName = (deviceId: string, name: string) =>
  saveBleDeviceNameAction({
    deviceId,
    name,
  });
