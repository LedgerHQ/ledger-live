// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import type { State } from ".";

export type DeviceLike = {
  id: string,
  name: string,
};

export type BleState = {
  knownDevices: DeviceLike[],
};

const initialState: BleState = {
  knownDevices: [],
};

const handlers: Object = {
  BLE_ADD_DEVICE: (state: BleState, { device }: { device: DeviceLike }) => ({
    knownDevices: state.knownDevices
      .filter(d => d.id !== device.id)
      .concat({ id: device.id, name: device.name }),
  }),

  BLE_REMOVE_DEVICE: (state: BleState, { deviceId }: { deviceId: string }) => ({
    knownDevices: state.knownDevices.filter(d => d.id !== deviceId),
  }),

  BLE_IMPORT: (state: BleState, { ble }: { ble: BleState }) => ({
    ...state,
    ...ble,
  }),

  BLE_SAVE_DEVICE_NAME: (
    state: BleState,
    { deviceId, name }: { deviceId: string, name: string },
  ) => ({
    knownDevices: state.knownDevices.map(
      d => (d.id === deviceId ? { ...d, name } : d),
    ),
  }),
};

// Selectors
export const exportSelector = (s: State) => s.ble;

export const knownDevicesSelector = (s: State) => s.ble.knownDevices;

export const deviceNameByDeviceIdSelector = (
  s: State,
  { deviceId }: { deviceId: string },
) => {
  const d = s.ble.knownDevices.find(d => d.id === deviceId);
  return d ? d.name : "";
};

export const deviceNameByNavigationDeviceIdSelector = (
  s: State,
  { navigation }: { navigation: * },
) =>
  deviceNameByDeviceIdSelector(s, {
    deviceId: navigation.getParam("deviceId"),
  });

export default handleActions(handlers, initialState);
