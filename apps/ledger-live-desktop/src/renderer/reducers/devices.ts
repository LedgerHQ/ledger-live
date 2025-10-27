import { handleActions } from "redux-actions";
import { getEnv } from "@ledgerhq/live-env";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { Handlers } from "./types";
import { SettingsState } from "./settings";
import { getSpeculosModel } from "@ledgerhq/live-common/e2e/speculosAppVersion";
import { createSelector } from "@reduxjs/toolkit";

export type DevicesState = {
  /**
   * only two possibilities: either there is a device or there isn't
   * (no third possibility undefined)
   * */
  currentDevice: Device | null;
  devices: Device[];
};
const initialState: DevicesState = {
  currentDevice: null,
  devices: [],
};

type HandlersPayloads = {
  RESET_DEVICES: never;
  ADD_DEVICE: Device;
  REMOVE_DEVICE: Device;
};
type DevicesHandlers<PreciseKey = true> = Handlers<DevicesState, HandlersPayloads, PreciseKey>;

const handlers: DevicesHandlers = {
  RESET_DEVICES: () => initialState,
  ADD_DEVICE: (state, { payload: device }) =>
    setCurrentDevice({
      ...state,
      devices: [...state.devices, device].filter(
        (v, i, s) => s.findIndex(t => t.deviceId === v.deviceId) === i,
      ),
    }),
  REMOVE_DEVICE: (state, { payload: device }) => ({
    ...state,
    currentDevice:
      state.currentDevice && state.currentDevice.deviceId === device.deviceId
        ? null
        : state.currentDevice,
    devices: state.devices.filter(d => d.deviceId !== device.deviceId),
  }),
};

function setCurrentDevice(state: DevicesState) {
  const currentDevice = state.devices.length ? state.devices[state.devices.length - 1] : null;
  return {
    ...state,
    currentDevice,
  };
}

export const getCurrentDevice = createSelector(
  [
    (state: { devices: DevicesState }) => state.devices.currentDevice,
    (state: { settings: SettingsState }) => state.settings.vaultSigner,
  ],
  (currentDevice, vaultSigner) => {
    if (vaultSigner.enabled) {
      const transportParams = new URLSearchParams();
      transportParams.append("host", vaultSigner.host);
      transportParams.append("token", vaultSigner.token);
      transportParams.append("workspace", vaultSigner.workspace);

      const deviceId = `vault-transport:${transportParams.toString()}`;

      return {
        deviceId,
        wired: true,
        modelId: DeviceModelId.nanoS,
      };
    }

    const envConditions = [
      { condition: getEnv("DEVICE_PROXY_URL"), modelId: DeviceModelId.nanoS },
      { condition: getEnv("MOCK") && !getEnv("MOCK_NO_BYPASS"), modelId: DeviceModelId.nanoS },
      { condition: getEnv("SPECULOS_API_PORT"), modelId: getSpeculosModel() },
    ];

    for (const { condition, modelId } of envConditions) {
      if (condition) {
        return {
          deviceId: "",
          wired: true,
          modelId,
        };
      }
    }

    return currentDevice;
  },
);

export default handleActions<DevicesState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as DevicesHandlers<false>,
  initialState,
);
