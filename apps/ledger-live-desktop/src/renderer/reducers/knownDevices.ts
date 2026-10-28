import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import {
  mockserverIdentifier,
  webBleTransportIdentifier,
  webHidTransportIdentifier,
} from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { getSpeculosModel } from "./devices";
import type { State } from "./index";
import type { SettingsState } from "./settings";

export type KnownDevicesState = {
  knownDevices: KnownDevice[];
};

/**
 * Stable, persisted transport codes. They decouple the on-disk format from the
 * DMK transport identifier strings (e.g. `webHidIdentifier`) so persisted data
 * survives a change of those identifiers. Add a new code here for each new
 * supported transport.
 */
export type PersistedKnownDeviceTransport = "webhid" | "webble";

const PERSISTED_TRANSPORT_BY_IDENTIFIER = new Map<string, PersistedKnownDeviceTransport>([
  [webHidTransportIdentifier, "webhid"],
  [webBleTransportIdentifier, "webble"],
]);

const IDENTIFIER_BY_PERSISTED_TRANSPORT: Record<PersistedKnownDeviceTransport, string> = {
  webhid: webHidTransportIdentifier,
  webble: webBleTransportIdentifier,
};

function isPersistedKnownDeviceTransport(
  transport: string,
): transport is PersistedKnownDeviceTransport {
  return Object.hasOwn(IDENTIFIER_BY_PERSISTED_TRANSPORT, transport);
}

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
 * Over WebHID there is no stable per-device identifier we want to persist. A wired known
 * device is therefore normalized as a WebHID device with an empty `id` and is uniquely
 * identified by its `deviceModelId`.
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

function mapSpeculosKnownDevice(): KnownDevice | null {
  if (!process.env.SPECULOS_API_PORT) return null;

  return {
    transport: speculosIdentifier,
    deviceModelId: getSpeculosModel(),
    id: "",
    name: null,
  };
}

function mapConnectedDevice(deviceModelId: DeviceModelId, name: string | null = null): KnownDevice {
  return mapSpeculosKnownDevice() ?? mapToWebHidKnownDevice(deviceModelId, name);
}

export function mapLastSeenDeviceToKnownDevice(
  device: DeviceModelInfo | null | undefined,
): KnownDevice | null {
  if (!device) return mapSpeculosKnownDevice();
  return mapConnectedDevice(device.modelId);
}

export function mapDeviceToKnownDevice(device: Device | null | undefined): KnownDevice | null {
  if (!device) return mapSpeculosKnownDevice();
  return mapConnectedDevice(device.modelId, device.deviceName ?? null);
}

/**
 * Same as `mapDeviceToKnownDevice` for a device reported at runtime. A Bluetooth device is
 * ignored here: it is remembered with its Bluetooth identity by `rememberKnownDevice`.
 */
function mapRuntimeDeviceToKnownDevice(device: Device | null | undefined): KnownDevice | null {
  if (device && !device.wired) return null;
  return mapDeviceToKnownDevice(device);
}

/**
 * Serialize a runtime known device for persistence. Returns `null` for any
 * transport that cannot be persisted, so unknown transports are dropped on save.
 */
export function mapKnownDeviceToPersistedKnownDevice(
  device: KnownDevice,
): PersistedKnownDevice | null {
  const transport = PERSISTED_TRANSPORT_BY_IDENTIFIER.get(device.transport);
  return transport ? { ...device, transport } : null;
}

/**
 * Deserialize a persisted known device. Returns `null` for any unknown/legacy
 * transport code, so malformed or unsupported records are dropped on load.
 */
export function mapPersistedKnownDeviceToKnownDevice(
  device: Omit<KnownDevice, "transport"> & { transport: string },
): KnownDevice | null {
  if (!isPersistedKnownDeviceTransport(device.transport)) return null;
  return { ...device, transport: IDENTIFIER_BY_PERSISTED_TRANSPORT[device.transport] };
}

function isMockServerDevice(device: KnownDevice): boolean {
  return device.transport === mockserverIdentifier;
}

/** A physical device is identified by its transport and model: one entry per pair. */
function upsertKnownDevice(state: KnownDevicesState, device: KnownDevice | null) {
  if (!device) return;

  const physicalIndex = state.knownDevices.findIndex(
    known =>
      known.transport === device.transport &&
      known.deviceModelId === device.deviceModelId &&
      !isMockServerDevice(known),
  );
  if (physicalIndex >= 0) {
    const existing = state.knownDevices[physicalIndex];
    state.knownDevices[physicalIndex] = {
      ...device,
      name: device.name ?? existing.name,
    };
    return;
  }

  const mockServerHasModel = state.knownDevices.some(
    known => known.deviceModelId === device.deviceModelId && isMockServerDevice(known),
  );
  if (!mockServerHasModel) state.knownDevices.push(device);
}

const knownDevicesSlice = createSlice({
  name: "knownDevices",
  initialState: INITIAL_STATE,
  reducers: {
    importKnownDevices: (_state, action: PayloadAction<KnownDevicesState>) => action.payload,
    rememberKnownDevice: (state, action: PayloadAction<KnownDevice>) => {
      upsertKnownDevice(state, action.payload);
    },
    seedMockServerKnownDevice: (state, action: PayloadAction<KnownDevice>) => {
      const savedDevices = state.knownDevices.filter(device => !isMockServerDevice(device));
      state.knownDevices = [...savedDevices, action.payload];
    },
  },
  extraReducers: builder => {
    builder
      .addMatcher(
        (action): action is PayloadAction<Partial<SettingsState>> =>
          action.type === "FETCH_SETTINGS",
        (state, action) => {
          const speculosDevice = mapSpeculosKnownDevice();
          if (speculosDevice) {
            state.knownDevices = [speculosDevice];
            return;
          }

          if (state.knownDevices.length > 0) return;

          const seed =
            mapLastSeenDeviceToKnownDevice(action.payload?.lastSeenDevice) ??
            mapDeviceToKnownDevice(action.payload?.lastOnboardedDevice);

          if (seed) state.knownDevices.push(seed);
        },
      )
      // Upsert when `lastSeenDevice` changes, for USB devices only: the Bluetooth ones are
      // remembered by the chooser with their own transport.
      .addMatcher(
        (action): action is PayloadAction<{ lastSeenDevice: DeviceModelInfo; wired: boolean }> =>
          action.type === "LAST_SEEN_DEVICE_INFO",
        (state, action) => {
          if (!action.payload.wired) return;
          upsertKnownDevice(state, mapLastSeenDeviceToKnownDevice(action.payload.lastSeenDevice));
        },
      )
      // Upsert when `lastOnboardedDevice` changes. Never remove on null.
      .addMatcher(
        (action): action is PayloadAction<Device | null> =>
          action.type === "SET_LAST_ONBOARDED_DEVICE",
        (state, action) => {
          upsertKnownDevice(state, mapRuntimeDeviceToKnownDevice(action.payload));
        },
      )
      // Upsert when `devices.currentDevice` changes (a device is added/connected).
      .addMatcher(
        (action): action is PayloadAction<Device> => action.type === "ADD_DEVICE",
        (state, action) => {
          upsertKnownDevice(state, mapRuntimeDeviceToKnownDevice(action.payload));
        },
      );
  },
});

export const { importKnownDevices, rememberKnownDevice, seedMockServerKnownDevice } =
  knownDevicesSlice.actions;

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
