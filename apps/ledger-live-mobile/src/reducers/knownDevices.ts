import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  rnBleTransportIdentifier,
  rnHidTransportIdentifier,
  type DeviceBaseInfo,
  findMatchingOldDevice,
} from "@ledgerhq/live-dmk-mobile";
import { dmkToLedgerDeviceIdMap, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { BleImportBlePayload, BleSaveDeviceNamePayload } from "~/actions/types";
import { BleActionTypes } from "~/actions/types";
import type { DeviceLike, State } from "~/reducers/types";

export type KnownDevicesState = {
  knownDevices: KnownDevice[];
};

export type PersistedKnownDeviceTransport = "rnble" | "rnhid";

export type PersistedKnownDevice = Omit<KnownDevice, "transport"> & {
  transport: PersistedKnownDeviceTransport;
};

export type PersistedKnownDevicesState = {
  knownDevices: PersistedKnownDevice[];
};

export const INITIAL_STATE: KnownDevicesState = {
  knownDevices: [],
};

function mapKnownDeviceToDeviceBaseInfo(device: KnownDevice): DeviceBaseInfo {
  return {
    deviceId: device.id,
    deviceName: device.name,
    modelId: device.deviceModelId,
  };
}

export function mapBleDeviceToKnownDevice(device: DeviceLike): KnownDevice {
  return {
    transport: rnBleTransportIdentifier,
    deviceModelId: device.modelId,
    id: device.id,
    name: device.name,
  };
}

export function mapDeviceToKnownDevice(device: Device): KnownDevice {
  return {
    transport: device.wired ? rnHidTransportIdentifier : rnBleTransportIdentifier,
    deviceModelId: device.modelId,
    id: device.deviceId,
    name: device.deviceName ?? null,
  };
}

export function mapDiscoveredDeviceToKnownDevice(device: DiscoveredDevice): KnownDevice {
  return {
    transport: device.transport,
    deviceModelId: dmkToLedgerDeviceIdMap[device.deviceModel.model],
    id: device.id,
    name: device.name,
  };
}

export function mapKnownDeviceToPersistedKnownDevice(
  device: KnownDevice,
): PersistedKnownDevice | null {
  if (device.transport === rnBleTransportIdentifier) {
    return {
      ...device,
      transport: "rnble",
    };
  }

  if (device.transport === rnHidTransportIdentifier) {
    return {
      ...device,
      transport: "rnhid",
    };
  }

  return null;
}

export function mapPersistedKnownDeviceToKnownDevice(
  device: Omit<KnownDevice, "transport"> & { transport: string },
): KnownDevice | null {
  if (device.transport === "rnble") {
    return {
      ...device,
      transport: rnBleTransportIdentifier,
    };
  }

  if (device.transport === "rnhid") {
    return {
      ...device,
      transport: rnHidTransportIdentifier,
    };
  }

  return null;
}

function upsertKnownDevice(state: KnownDevicesState, device: KnownDevice) {
  const existingDeviceIndex = state.knownDevices.findIndex(d => d.id === device.id);

  if (existingDeviceIndex === -1) {
    state.knownDevices.push({ ...device });
    return;
  }

  state.knownDevices[existingDeviceIndex] = { ...device };
}

function findMatchingKnownDevice(
  newDevice: KnownDevice,
  knownDevices: KnownDevice[],
): KnownDevice | null {
  const oldDevicesForTransport = knownDevices.filter(
    device => device.transport === newDevice.transport,
  );
  const matchingOldDevice = findMatchingOldDevice(
    mapKnownDeviceToDeviceBaseInfo(newDevice),
    oldDevicesForTransport.map(mapKnownDeviceToDeviceBaseInfo),
  );

  return (
    (matchingOldDevice &&
      oldDevicesForTransport.find(device => device.id === matchingOldDevice.deviceId)) ??
    null
  );
}

const knownDevicesSlice = createSlice({
  name: "knownDevices",
  initialState: INITIAL_STATE,
  reducers: {
    importKnownDevices: (_state, action: PayloadAction<KnownDevicesState>) => action.payload,
    addKnownDevice: (state, action: PayloadAction<KnownDevice>) => {
      upsertKnownDevice(state, action.payload);
    },
    updateKnownDevice: (state, action: PayloadAction<KnownDevice>) => {
      const newDevice = action.payload;
      const deviceToUpdate = findMatchingKnownDevice(newDevice, state.knownDevices);

      if (!deviceToUpdate) {
        upsertKnownDevice(state, newDevice);
        return;
      }

      state.knownDevices = state.knownDevices.map(device =>
        device.id === deviceToUpdate.id ? { ...device, ...newDevice } : device,
      );
    },
    removeKnownDevice: (state, action: PayloadAction<string>) => {
      state.knownDevices = state.knownDevices.filter(device => device.id !== action.payload);
    },
    removeKnownDevices: (state, action: PayloadAction<string[]>) => {
      state.knownDevices = state.knownDevices.filter(device => !action.payload.includes(device.id));
    },
    saveKnownDeviceName: (state, action: PayloadAction<BleSaveDeviceNamePayload>) => {
      const { deviceId, name } = action.payload;
      state.knownDevices = state.knownDevices.map(device =>
        device.id === deviceId ? { ...device, name } : device,
      );
    },
  },
  extraReducers: builder => {
    builder.addMatcher(
      (action): action is PayloadAction<BleImportBlePayload> =>
        action.type === BleActionTypes.BLE_IMPORT,
      (state, action) => {
        const payload = action.payload;
        if (state.knownDevices.length > 0 || !payload?.knownDevices?.length) {
          return;
        }

        state.knownDevices = payload.knownDevices.map(mapBleDeviceToKnownDevice);
      },
    );
  },
});

export const {
  importKnownDevices,
  addKnownDevice,
  updateKnownDevice,
  removeKnownDevice,
  removeKnownDevices,
  saveKnownDeviceName,
} = knownDevicesSlice.actions;

export const exportSelector = (state: State): PersistedKnownDevicesState => ({
  knownDevices: state.knownDevices.knownDevices.flatMap(device => {
    const persistedDevice = mapKnownDeviceToPersistedKnownDevice(device);
    return persistedDevice ? [persistedDevice] : [];
  }),
});
export const knownDevicesSelector = (state: State) => state.knownDevices.knownDevices;

export default knownDevicesSlice.reducer;
