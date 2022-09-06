import { handleActions } from "redux-actions";
import type { Action } from "redux-actions";
import type { BleState, State } from "./types";
import type {
  BleAddKnownDevicePayload,
  BleImportBlePayload,
  BlePayload,
  BleRemoveKnownDevicePayload,
  BleRemoveKnownDevicesPayload,
  BleSaveDeviceNamePayload,
} from "../actions/types";
import { BleActionTypes } from "../actions/types";

const initialState: BleState = {
  knownDevices: [],
};
const handlers = {
  [BleActionTypes.BLE_ADD_DEVICE]: (
    state: BleState,
    { payload: { device } }: Action<BleAddKnownDevicePayload>,
  ) => ({
    knownDevices: state.knownDevices
      .filter(d => d.id !== device.id)
      .concat({ ...device }),
  }),
  [BleActionTypes.BLE_REMOVE_DEVICE]: (
    state: BleState,
    { payload: { deviceId } }: Action<BleRemoveKnownDevicePayload>,
  ) => ({
    knownDevices: state.knownDevices.filter(d => d.id !== deviceId),
  }),
  [BleActionTypes.BLE_REMOVE_DEVICES]: (
    state: BleState,
    { payload: { ids } }: Action<BleRemoveKnownDevicesPayload>,
  ) => ({
    knownDevices: state.knownDevices.filter(d => !ids.includes(d.id)),
  }),
  [BleActionTypes.BLE_IMPORT]: (
    state: BleState,
    { payload: ble }: Action<BleImportBlePayload>,
  ) => ({ ...state, ...ble }),
  [BleActionTypes.BLE_SAVE_DEVICE_NAME]: (
    state: BleState,
    { payload: { deviceId, name } }: Action<BleSaveDeviceNamePayload>,
  ) => ({
    knownDevices: state.knownDevices.map(d =>
      d.id === deviceId ? { ...d, name } : d,
    ),
  }),
};
// Selectors
export const exportSelector = (s: State) => s.ble;
export const knownDevicesSelector = (s: State) => s.ble.knownDevices;
export const deviceNameByDeviceIdSelectorCreator =
  (deviceId: string) => (s: State) => {
    const d = s.ble.knownDevices.find(d => d.id === deviceId);
    return d ? d.name : "";
  };

export default handleActions<BleState, BlePayload>(handlers, initialState);
