// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import type { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { State } from ".";

export type DeviceLike = {
  id: string,
  name: string,
  deviceInfo?: DeviceInfo,
  appsInstalled?: number,
  modelId?: DeviceModelId,
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
      .concat({ ...device }),
  }),

  BLE_REMOVE_DEVICE: (state: BleState, { deviceId }: { deviceId: string }) => ({
    knownDevices: state.knownDevices.filter(d => d.id !== deviceId),
  }),

  BLE_REMOVE_DEVICES: (state: BleState, { ids }: { ids: string[] }) => ({
    knownDevices: state.knownDevices.filter(d => !ids.includes(d.id)),
  }),

  BLE_IMPORT: (state: BleState, { ble }: { ble: BleState }) => ({
    ...state,
    ...ble,
  }),

  BLE_SAVE_DEVICE_NAME: (
    state: BleState,
    { deviceId, name }: { deviceId: string, name: string },
  ) => ({
    knownDevices: state.knownDevices.map(d =>
      d.id === deviceId ? { ...d, name } : d,
    ),
  }),
};

// Selectors
export const exportSelector = (s: State) => s.ble;

export const knownDevicesSelector = (s: State) => s.ble.knownDevices;

export const deviceNameByDeviceIdSelectorCreator = (deviceId: string) => (
  s: State,
) => {
  const d = s.ble.knownDevices.find(d => d.id === deviceId);
  return d ? d.name : "";
};

export default handleActions(handlers, initialState);
