import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { webHidTransportIdentifier } from "@ledgerhq/live-dmk-desktop";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { State } from "./index";
import type { SettingsState } from "./settings";

export type KnownDevicesState = {
  knownDevices: KnownDevice[];
};

/**
 * Stable, persisted transport codes. They decouple the on-disk format from the
 * DMK transport identifier strings (e.g. `webHidIdentifier`) so persisted data
 * survives a change of those identifiers. Add a new code here for each new
 * supported transport (e.g. `"webble"`).
 */
export type PersistedKnownDeviceTransport = "webhid";

export type PersistedKnownDevice = Omit<KnownDevice, "transport"> & {
  transport: PersistedKnownDeviceTransport;
};

export type PersistedKnownDevicesState = {
  knownDevices: PersistedKnownDevice[];
};

export const INITIAL_STATE: KnownDevicesState = {
  knownDevices: [],
};

/**
 * On desktop, devices connect over WebHID, which does not expose a stable per-device
 * identifier we want to persist. A known device is therefore normalized as a WebHID
 * device with an empty `id` and is uniquely identified by its `deviceModelId`.
 */
function mapToWebHidKnownDevice(
  deviceModelId: DeviceModelId,
  name: string | null = null,
): KnownDevice {
  return {
    transport: webHidTransportIdentifier,
    deviceModelId,
    id: "",
    name,
  };
}

export function mapLastSeenDeviceToKnownDevice(
  device: DeviceModelInfo | null | undefined,
): KnownDevice | null {
  if (!device) return null;
  return mapToWebHidKnownDevice(device.modelId);
}

export function mapDeviceToKnownDevice(device: Device | null | undefined): KnownDevice | null {
  if (!device) return null;
  return mapToWebHidKnownDevice(device.modelId, device.deviceName ?? null);
}

/**
 * Serialize a runtime known device for persistence. Returns `null` for any
 * transport that cannot be persisted, so unknown transports are dropped on save.
 */
export function mapKnownDeviceToPersistedKnownDevice(
  device: KnownDevice,
): PersistedKnownDevice | null {
  if (device.transport === webHidTransportIdentifier) {
    return { ...device, transport: "webhid" };
  }

  return null;
}

/**
 * Deserialize a persisted known device. Returns `null` for any unknown/legacy
 * transport code, so malformed or unsupported records are dropped on load.
 */
export function mapPersistedKnownDeviceToKnownDevice(
  device: Omit<KnownDevice, "transport"> & { transport: string },
): KnownDevice | null {
  if (device.transport === "webhid") {
    return { ...device, transport: webHidTransportIdentifier };
  }

  return null;
}

function upsertKnownDevice(state: KnownDevicesState, device: KnownDevice | null) {
  if (!device) return;

  const existingIndex = state.knownDevices.findIndex(d => d.deviceModelId === device.deviceModelId);

  if (existingIndex === -1) {
    state.knownDevices.push(device);
    return;
  }

  const existing = state.knownDevices[existingIndex];
  state.knownDevices[existingIndex] = {
    ...device,
    // Keep a previously known name when the new source does not provide one.
    name: device.name ?? existing.name,
  };
}

const knownDevicesSlice = createSlice({
  name: "knownDevices",
  initialState: INITIAL_STATE,
  reducers: {
    importKnownDevices: (_state, action: PayloadAction<KnownDevicesState>) => action.payload,
  },
  extraReducers: builder => {
    builder
      // On settings load, seed the store only when empty: prefer `lastSeenDevice`,
      // fallback to `lastOnboardedDevice`.
      .addMatcher(
        (action): action is PayloadAction<Partial<SettingsState>> =>
          action.type === "FETCH_SETTINGS",
        (state, action) => {
          if (state.knownDevices.length > 0) return;

          const seed =
            mapLastSeenDeviceToKnownDevice(action.payload?.lastSeenDevice) ??
            mapDeviceToKnownDevice(action.payload?.lastOnboardedDevice);

          if (seed) state.knownDevices.push(seed);
        },
      )
      // Upsert when `lastSeenDevice` changes.
      .addMatcher(
        (action): action is PayloadAction<{ lastSeenDevice: DeviceModelInfo }> =>
          action.type === "LAST_SEEN_DEVICE_INFO",
        (state, action) => {
          upsertKnownDevice(state, mapLastSeenDeviceToKnownDevice(action.payload?.lastSeenDevice));
        },
      )
      // Upsert when `lastOnboardedDevice` changes. Never remove on null.
      .addMatcher(
        (action): action is PayloadAction<Device | null> =>
          action.type === "SET_LAST_ONBOARDED_DEVICE",
        (state, action) => {
          upsertKnownDevice(state, mapDeviceToKnownDevice(action.payload));
        },
      )
      // Upsert when `devices.currentDevice` changes (a device is added/connected).
      .addMatcher(
        (action): action is PayloadAction<Device> => action.type === "ADD_DEVICE",
        (state, action) => {
          upsertKnownDevice(state, mapDeviceToKnownDevice(action.payload));
        },
      );
  },
});

export const { importKnownDevices } = knownDevicesSlice.actions;

export const knownDevicesSelector = (state: State): KnownDevice[] =>
  state.knownDevices.knownDevices;

/** Persisted (export) projection of the known devices store. */
export const knownDevicesStoreSelector = (state: State): PersistedKnownDevicesState => ({
  knownDevices: state.knownDevices.knownDevices.flatMap(device => {
    const persistedDevice = mapKnownDeviceToPersistedKnownDevice(device);
    return persistedDevice ? [persistedDevice] : [];
  }),
});

export default knownDevicesSlice.reducer;
