import { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { webHidTransportIdentifier } from "@ledgerhq/live-dmk-desktop";
import type { DeviceInfo, DeviceModelInfo } from "@ledgerhq/types-live";
import reducer, {
  INITIAL_STATE,
  importKnownDevices,
  knownDevicesSelector,
  knownDevicesStoreSelector,
  mapKnownDeviceToPersistedKnownDevice,
  mapPersistedKnownDeviceToKnownDevice,
  type KnownDevicesState,
  type PersistedKnownDevice,
} from "./knownDevices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { State } from "./index";

const makeLastSeenDevice = (modelId: DeviceModelId): DeviceModelInfo => ({
  modelId,
  deviceInfo: {} as DeviceInfo,
  apps: [],
});

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
  deviceId: "device-id",
  deviceName: "My Ledger",
  modelId: DeviceModelId.stax,
  wired: true,
  ...overrides,
});

const fetchSettings = (payload: Record<string, unknown>) => ({ type: "FETCH_SETTINGS", payload });
const lastSeenDeviceInfo = (modelId: DeviceModelId) => ({
  type: "LAST_SEEN_DEVICE_INFO",
  payload: { lastSeenDevice: makeLastSeenDevice(modelId) },
});
const setLastOnboardedDevice = (payload: Device | null) => ({
  type: "SET_LAST_ONBOARDED_DEVICE",
  payload,
});
const addDevice = (payload: Device) => ({ type: "ADD_DEVICE", payload });

describe("knownDevices reducer", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(INITIAL_STATE);
  });

  describe("migration on settings fetch", () => {
    it("seeds from lastSeenDevice when empty", () => {
      const state = reducer(
        INITIAL_STATE,
        fetchSettings({ lastSeenDevice: makeLastSeenDevice(DeviceModelId.stax) }),
      );
      expect(state.knownDevices).toEqual([
        {
          transport: webHidTransportIdentifier,
          deviceModelId: DeviceModelId.stax,
          id: "",
          name: null,
        },
      ]);
    });

    it("falls back to lastOnboardedDevice when lastSeenDevice is missing", () => {
      const state = reducer(
        INITIAL_STATE,
        fetchSettings({
          lastSeenDevice: null,
          lastOnboardedDevice: makeDevice({
            modelId: DeviceModelId.europa,
            deviceName: "My Flex",
          }),
        }),
      );
      expect(state.knownDevices).toEqual([
        {
          transport: webHidTransportIdentifier,
          deviceModelId: DeviceModelId.europa,
          id: "",
          name: "My Flex",
        },
      ]);
    });

    it("prefers lastSeenDevice over lastOnboardedDevice", () => {
      const state = reducer(
        INITIAL_STATE,
        fetchSettings({
          lastSeenDevice: makeLastSeenDevice(DeviceModelId.stax),
          lastOnboardedDevice: makeDevice({ modelId: DeviceModelId.europa }),
        }),
      );
      expect(state.knownDevices).toHaveLength(1);
      expect(state.knownDevices[0].deviceModelId).toBe(DeviceModelId.stax);
    });

    it("does nothing when both sources are null", () => {
      const state = reducer(
        INITIAL_STATE,
        fetchSettings({ lastSeenDevice: null, lastOnboardedDevice: null }),
      );
      expect(state.knownDevices).toEqual([]);
    });

    it("does not seed when known devices already exist", () => {
      const seeded: KnownDevicesState = {
        knownDevices: [
          {
            transport: webHidTransportIdentifier,
            deviceModelId: DeviceModelId.europa,
            id: "",
            name: null,
          },
        ],
      };
      const state = reducer(
        seeded,
        fetchSettings({ lastSeenDevice: makeLastSeenDevice(DeviceModelId.stax) }),
      );
      expect(state.knownDevices).toEqual(seeded.knownDevices);
    });
  });

  describe("upsert", () => {
    it("upserts on lastSeenDevice change", () => {
      const state = reducer(INITIAL_STATE, lastSeenDeviceInfo(DeviceModelId.stax));
      expect(state.knownDevices).toEqual([
        {
          transport: webHidTransportIdentifier,
          deviceModelId: DeviceModelId.stax,
          id: "",
          name: null,
        },
      ]);
    });

    it("upserts on lastOnboardedDevice change", () => {
      const state = reducer(
        INITIAL_STATE,
        setLastOnboardedDevice(makeDevice({ modelId: DeviceModelId.europa, deviceName: "Flex" })),
      );
      expect(state.knownDevices).toEqual([
        {
          transport: webHidTransportIdentifier,
          deviceModelId: DeviceModelId.europa,
          id: "",
          name: "Flex",
        },
      ]);
    });

    it("upserts on current device change", () => {
      const state = reducer(
        INITIAL_STATE,
        addDevice(makeDevice({ modelId: DeviceModelId.stax, deviceName: "Stax" })),
      );
      expect(state.knownDevices).toEqual([
        {
          transport: webHidTransportIdentifier,
          deviceModelId: DeviceModelId.stax,
          id: "",
          name: "Stax",
        },
      ]);
    });

    it("dedupes by device model id", () => {
      let state = reducer(INITIAL_STATE, addDevice(makeDevice({ modelId: DeviceModelId.stax })));
      state = reducer(state, lastSeenDeviceInfo(DeviceModelId.stax));
      state = reducer(state, addDevice(makeDevice({ modelId: DeviceModelId.europa })));
      expect(state.knownDevices.map(d => d.deviceModelId)).toEqual([
        DeviceModelId.stax,
        DeviceModelId.europa,
      ]);
    });

    it("keeps a previously known name when the new source has none", () => {
      let state = reducer(
        INITIAL_STATE,
        addDevice(makeDevice({ modelId: DeviceModelId.stax, deviceName: "My Stax" })),
      );
      // lastSeenDevice carries no name; the existing name must be preserved.
      state = reducer(state, lastSeenDeviceInfo(DeviceModelId.stax));
      expect(state.knownDevices[0].name).toBe("My Stax");
    });
  });

  describe("null sources", () => {
    it("never removes known devices when lastOnboardedDevice becomes null", () => {
      const seeded: KnownDevicesState = {
        knownDevices: [
          {
            transport: webHidTransportIdentifier,
            deviceModelId: DeviceModelId.stax,
            id: "",
            name: null,
          },
        ],
      };
      const state = reducer(seeded, setLastOnboardedDevice(null));
      expect(state.knownDevices).toEqual(seeded.knownDevices);
    });
  });

  describe("import", () => {
    it("replaces the state with the persisted known devices", () => {
      const persisted: KnownDevicesState = {
        knownDevices: [
          {
            transport: webHidTransportIdentifier,
            deviceModelId: DeviceModelId.europa,
            id: "",
            name: "Flex",
          },
        ],
      };
      const state = reducer(INITIAL_STATE, importKnownDevices(persisted));
      expect(state).toEqual(persisted);
    });
  });

  describe("selector", () => {
    it("returns the known devices from the root state", () => {
      const knownDevices = [
        {
          transport: webHidTransportIdentifier,
          deviceModelId: DeviceModelId.stax,
          id: "",
          name: null,
        },
      ];
      expect(knownDevicesSelector({ knownDevices: { knownDevices } } as State)).toEqual(
        knownDevices,
      );
    });
  });

  describe("serialization", () => {
    const webHidKnownDevice: KnownDevice = {
      transport: webHidTransportIdentifier,
      deviceModelId: DeviceModelId.stax,
      id: "",
      name: "My Stax",
    };

    describe("mapKnownDeviceToPersistedKnownDevice", () => {
      it("persists a web-hid device using the stable transport code", () => {
        expect(mapKnownDeviceToPersistedKnownDevice(webHidKnownDevice)).toEqual({
          ...webHidKnownDevice,
          transport: "webhid",
        });
      });

      it("returns null for an unsupported transport", () => {
        const device = { ...webHidKnownDevice, transport: "httpdebug" } as KnownDevice;
        expect(mapKnownDeviceToPersistedKnownDevice(device)).toBeNull();
      });
    });

    describe("mapPersistedKnownDeviceToKnownDevice", () => {
      it("hydrates a persisted web-hid device to the runtime transport identifier", () => {
        const persisted: PersistedKnownDevice = {
          transport: "webhid",
          deviceModelId: DeviceModelId.europa,
          id: "",
          name: "Flex",
        };
        expect(mapPersistedKnownDeviceToKnownDevice(persisted)).toEqual({
          transport: webHidTransportIdentifier,
          deviceModelId: DeviceModelId.europa,
          id: "",
          name: "Flex",
        });
      });

      it("returns null for an unknown persisted transport code", () => {
        const device = {
          transport: "unsupported",
          deviceModelId: DeviceModelId.stax,
          id: "",
          name: null,
        };
        expect(mapPersistedKnownDeviceToKnownDevice(device)).toBeNull();
      });
    });

    describe("knownDevicesStoreSelector (export)", () => {
      it("exports supported devices with their stable transport code", () => {
        const state = { knownDevices: { knownDevices: [webHidKnownDevice] } } as State;
        expect(knownDevicesStoreSelector(state)).toEqual({
          knownDevices: [{ ...webHidKnownDevice, transport: "webhid" }],
        });
      });

      it("drops devices with unsupported transports", () => {
        const state = {
          knownDevices: {
            knownDevices: [
              webHidKnownDevice,
              { ...webHidKnownDevice, transport: "httpdebug" } as KnownDevice,
            ],
          },
        } as State;
        expect(knownDevicesStoreSelector(state)).toEqual({
          knownDevices: [{ ...webHidKnownDevice, transport: "webhid" }],
        });
      });
    });

    it("round-trips a web-hid device through export and import", () => {
      const persisted = mapKnownDeviceToPersistedKnownDevice(webHidKnownDevice);
      expect(persisted).not.toBeNull();
      expect(mapPersistedKnownDeviceToKnownDevice(persisted as PersistedKnownDevice)).toEqual(
        webHidKnownDevice,
      );
    });
  });
});
