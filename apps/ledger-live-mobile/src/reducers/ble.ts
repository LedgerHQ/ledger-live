import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { BleState, DeviceLike, State } from "./types";
import type {
  BleAddKnownDevicePayload,
  BleImportBlePayload,
  BlePayload,
  BleRemoveKnownDevicePayload,
  BleRemoveKnownDevicesPayload,
  BleSaveDeviceNamePayload,
  BleUpdateKnownDevicePayload,
  DangerouslyOverrideStatePayload,
} from "../actions/types";
import { BleActionTypes } from "../actions/types";
import {
  DeviceBaseInfo,
  findMatchingOldDevice,
} from "~/components/SelectDevice2/matchDevicesByNameOrId";

export const INITIAL_STATE = {
  knownDevices: [],
};

function mapDeviceLikeToDeviceBaseInfo(device: DeviceLike): DeviceBaseInfo {
  return {
    deviceId: device.id,
    deviceName: device.name,
    modelId: device.modelId,
  };
}

const handlers: ReducerMap<BleState, BlePayload> = {
  [BleActionTypes.BLE_ADD_DEVICE]: (state, action) => {
    const device = (action as Action<BleAddKnownDevicePayload>).payload;
    return {
      knownDevices: state.knownDevices.filter(d => d.id !== device.id).concat({ ...device }),
    };
  },
  [BleActionTypes.BLE_UPDATE_DEVICE]: (state, action) => {
    const newDevice = (action as Action<BleUpdateKnownDevicePayload>).payload;
    const deviceToUpdate = findMatchingOldDevice(
      mapDeviceLikeToDeviceBaseInfo(newDevice),
      state.knownDevices.map(mapDeviceLikeToDeviceBaseInfo),
    );
    if (!deviceToUpdate) {
      return state;
    }
    return {
      knownDevices: state.knownDevices.map(d =>
        d.id === deviceToUpdate.deviceId ? { ...d, ...newDevice } : d,
      ),
    };
  },
  [BleActionTypes.BLE_REMOVE_DEVICE]: (state, action) => ({
    knownDevices: state.knownDevices.filter(
      d => d.id !== (action as Action<BleRemoveKnownDevicePayload>).payload,
    ),
  }),
  [BleActionTypes.BLE_REMOVE_DEVICES]: (state, action) => ({
    knownDevices: state.knownDevices.filter(
      d => !(action as Action<BleRemoveKnownDevicesPayload>).payload.includes(d.id),
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
      knownDevices: state.knownDevices.map(d => (d.id === deviceId ? { ...d, name } : d)),
    };
  },

  [BleActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (state: BleState, action): BleState => ({
    ...state,
    ...(action as Action<DangerouslyOverrideStatePayload>).payload.ble,
  }),
};
// Selectors
export const exportSelector = (s: State) => s.ble;
export const bleDevicesSelector = (s: State) => s.ble.knownDevices;

export default handleActions<BleState, BlePayload>(handlers, INITIAL_STATE);
