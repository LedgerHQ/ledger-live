import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import { DeviceModelId } from "@ledgerhq/types-devices";
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

export const INITIAL_STATE = {
  knownDevices: [],
};
const handlers: ReducerMap<BleState, BlePayload> = {
  [BleActionTypes.BLE_ADD_DEVICE]: (state, action) => {
    const {
      payload: { device },
    } = action as Action<BleAddKnownDevicePayload>;
    return {
      knownDevices: state.knownDevices
        .filter(d => d.id !== device.id)
        .concat({ ...device }),
    };
  },
  [BleActionTypes.BLE_REMOVE_DEVICE]: (state, action) => ({
    knownDevices: state.knownDevices.filter(
      d =>
        d.id !==
        (action as Action<BleRemoveKnownDevicePayload>).payload.deviceId,
    ),
  }),
  [BleActionTypes.BLE_REMOVE_DEVICES]: (state, action) => ({
    knownDevices: state.knownDevices.filter(
      d =>
        !(action as Action<BleRemoveKnownDevicesPayload>).payload.ids.includes(
          d.id,
        ),
    ),
  }),
  [BleActionTypes.BLE_IMPORT]: (state, action) => ({
    ...state,
    ...(action as Action<BleImportBlePayload>).payload,
  }),
  [BleActionTypes.BLE_SAVE_DEVICE_NAME]: (state, action) => {
    const {
      payload: { deviceId, name },
    } = action as Action<BleSaveDeviceNamePayload>;
    return {
      knownDevices: state.knownDevices.map(d =>
        d.id === deviceId ? { ...d, name } : d,
      ),
    };
  },
};
// Selectors
export const exportSelector = (s: State) => s.ble;
export const knownDevicesSelector = (s: State) => {
  // Nb workaround to prevent crash for dev/qa that have nanoFTS references.
  // to be removed in a while.
  return s.ble.knownDevices.map(knownDevice => ({
    ...knownDevice,
    modelId:
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      knownDevice.modelId === "nanoFTS"
        ? DeviceModelId.stax
        : knownDevice.modelId,
  }));
};
export const deviceNameByDeviceIdSelectorCreator =
  (deviceId: string) => (s: State) => {
    const d = s.ble.knownDevices.find(d => d.id === deviceId);
    return d ? d.name : "";
  };

export default handleActions<BleState, BlePayload>(handlers, INITIAL_STATE);
