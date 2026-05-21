import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import {
  DeviceModelId as DMKDeviceModelId,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { importBle } from "~/actions/ble";
import rootReducer from "../index";
import reducer, {
  INITIAL_STATE,
  addKnownDevice,
  exportSelector,
  importKnownDevices,
  knownDevicesSelector,
  mapBleDeviceToKnownDevice,
  mapDeviceToKnownDevice,
  mapDiscoveredDeviceToKnownDevice,
  mapKnownDeviceToPersistedKnownDevice,
  mapPersistedKnownDeviceToKnownDevice,
  type PersistedKnownDevice,
  removeKnownDevice,
  removeKnownDevices,
  saveKnownDeviceName,
  updateKnownDevice,
} from "../knownDevices";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  rnBleTransportIdentifier: "react-native-ble",
  rnHidTransportIdentifier: "react-native-hid",
}));

describe("knownDevices reducer", () => {
  const nanoX = {
    id: "ble-id",
    name: "Ledger Nano X 123A",
    deviceModelId: DeviceModelId.nanoX,
    transport: rnBleTransportIdentifier,
  };

  const flex = {
    id: "usb-id",
    name: "Ledger Flex",
    deviceModelId: DeviceModelId.europa,
    transport: rnHidTransportIdentifier,
  };

  const nanoSPlus = {
    id: "1002",
    name: "Nano S Plus",
    deviceModelId: DeviceModelId.nanoSP,
    transport: rnHidTransportIdentifier,
  };

  const discoveredNanoX: DiscoveredDevice = {
    id: "discovered-ble-id",
    name: "Discovered Nano X",
    deviceModel: {
      id: DMKDeviceModelId.NANO_X,
      model: DMKDeviceModelId.NANO_X,
      name: "Ledger Nano X",
    },
    transport: rnBleTransportIdentifier,
  };

  describe("initialization", () => {
    it("GIVEN no previous state WHEN the reducer initializes THEN it returns the initial state", () => {
      // GIVEN
      const state = undefined;

      // WHEN
      const nextState = reducer(state, { type: "@@INIT" });

      // THEN
      expect(nextState).toEqual(INITIAL_STATE);
    });
  });

  describe("importKnownDevices", () => {
    it("GIVEN persisted known devices WHEN importing them THEN it replaces the slice state", () => {
      // GIVEN
      const state = INITIAL_STATE;
      const knownDevices = [nanoX];

      // WHEN
      const nextState = reducer(state, importKnownDevices({ knownDevices }));

      // THEN
      expect(nextState.knownDevices).toEqual(knownDevices);
    });
  });

  describe("addKnownDevice", () => {
    it("GIVEN no known devices WHEN adding a known device THEN it appends the device", () => {
      // GIVEN
      const state = INITIAL_STATE;

      // WHEN
      const nextState = reducer(state, addKnownDevice(nanoX));

      // THEN
      expect(nextState.knownDevices).toEqual([nanoX]);
    });

    it("GIVEN existing known devices WHEN adding a known device with an existing id THEN it replaces the device without changing order", () => {
      // GIVEN
      const state = { knownDevices: [flex, nanoX] };
      const updatedDevice = {
        ...nanoX,
        name: "Custom Nano X",
      };

      // WHEN
      const nextState = reducer(state, addKnownDevice(updatedDevice));

      // THEN
      expect(nextState.knownDevices).toEqual([flex, updatedDevice]);
    });
  });

  describe("updateKnownDevice", () => {
    it("GIVEN an existing known device WHEN updating a matching device THEN it updates the existing entry", () => {
      // GIVEN
      const state = { knownDevices: [flex, nanoX] };
      const updatedDevice = {
        ...nanoX,
        id: "new-ble-id",
        name: "123A",
      };

      // WHEN
      const nextState = reducer(state, updateKnownDevice(updatedDevice));

      // THEN
      expect(nextState.knownDevices).toEqual([flex, updatedDevice]);
    });

    it("GIVEN no matching known device WHEN updating a device THEN it appends the device", () => {
      // GIVEN
      const state = { knownDevices: [flex] };

      // WHEN
      const nextState = reducer(state, updateKnownDevice(nanoX));

      // THEN
      expect(nextState.knownDevices).toEqual([flex, nanoX]);
    });

    it("GIVEN an existing HID known device WHEN updating the same model with a new id THEN it updates the existing entry", () => {
      // GIVEN
      const state = { knownDevices: [flex, nanoSPlus] };
      const updatedDevice = {
        ...nanoSPlus,
        id: "usb_1002",
        name: "Ledger Nano S Plus",
      };

      // WHEN
      const nextState = reducer(state, updateKnownDevice(updatedDevice));

      // THEN
      expect(nextState.knownDevices).toEqual([flex, updatedDevice]);
    });
  });

  describe("removeKnownDevice", () => {
    it("GIVEN multiple known devices WHEN removing one known device THEN it removes only the matching device", () => {
      // GIVEN
      const state = { knownDevices: [nanoX, flex] };

      // WHEN
      const nextState = reducer(state, removeKnownDevice("ble-id"));

      // THEN
      expect(nextState.knownDevices).toEqual([flex]);
    });
  });

  describe("removeKnownDevices", () => {
    it("GIVEN multiple known devices WHEN removing several known devices THEN it removes all matching devices", () => {
      // GIVEN
      const state = { knownDevices: [nanoX, flex] };

      // WHEN
      const nextState = reducer(state, removeKnownDevices(["ble-id", "usb-id"]));

      // THEN
      expect(nextState.knownDevices).toEqual([]);
    });
  });

  describe("saveKnownDeviceName", () => {
    it("GIVEN multiple known devices WHEN saving a device name THEN it renames only the matching device", () => {
      // GIVEN
      const state = { knownDevices: [nanoX, flex] };

      // WHEN
      const nextState = reducer(
        state,
        saveKnownDeviceName({ deviceId: "ble-id", name: "Renamed" }),
      );

      // THEN
      expect(nextState.knownDevices).toEqual([{ ...nanoX, name: "Renamed" }, flex]);
    });
  });

  describe("BLE_IMPORT extra reducer", () => {
    it("GIVEN an empty known devices state WHEN importing legacy BLE devices THEN it initializes known devices", () => {
      // GIVEN
      const state = INITIAL_STATE;
      const action = importBle({
        knownDevices: [{ id: "legacy-ble-id", name: "Legacy", modelId: DeviceModelId.nanoX }],
      });

      // WHEN
      const nextState = reducer(state, action);

      // THEN
      expect(nextState.knownDevices).toEqual([
        {
          id: "legacy-ble-id",
          name: "Legacy",
          deviceModelId: DeviceModelId.nanoX,
          transport: rnBleTransportIdentifier,
        },
      ]);
    });

    it("GIVEN an empty known devices state WHEN importing no legacy BLE devices THEN it keeps known devices empty", () => {
      // GIVEN
      const state = INITIAL_STATE;
      const action = importBle({ knownDevices: [] });

      // WHEN
      const nextState = reducer(state, action);

      // THEN
      expect(nextState.knownDevices).toEqual([]);
    });

    it("GIVEN existing known devices WHEN importing legacy BLE devices THEN it keeps the existing known devices", () => {
      // GIVEN
      const state = { knownDevices: [flex] };
      const action = importBle({
        knownDevices: [{ id: "legacy-ble-id", name: "Legacy", modelId: DeviceModelId.nanoX }],
      });

      // WHEN
      const nextState = reducer(state, action);

      // THEN
      expect(nextState.knownDevices).toEqual([flex]);
    });
  });

  describe("mapDeviceToKnownDevice", () => {
    it("GIVEN an unwired selected device WHEN mapping it THEN it returns a BLE known device", () => {
      // GIVEN
      const device = {
        deviceId: "ble-id",
        deviceName: "BLE Ledger",
        modelId: DeviceModelId.nanoX,
        wired: false,
      };

      // WHEN
      const knownDevice = mapDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toEqual({
        id: "ble-id",
        name: "BLE Ledger",
        deviceModelId: DeviceModelId.nanoX,
        transport: rnBleTransportIdentifier,
      });
    });

    it("GIVEN a wired selected device WHEN mapping it THEN it returns a HID known device", () => {
      // GIVEN
      const device = {
        deviceId: "usb-id",
        deviceName: "USB Ledger",
        modelId: DeviceModelId.europa,
        wired: true,
      };

      // WHEN
      const knownDevice = mapDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toEqual({
        id: "usb-id",
        name: "USB Ledger",
        deviceModelId: DeviceModelId.europa,
        transport: rnHidTransportIdentifier,
      });
    });

    it("GIVEN a selected device without a name WHEN mapping it THEN it uses a null name", () => {
      // GIVEN
      const device = {
        deviceId: "ble-id",
        modelId: DeviceModelId.nanoX,
        wired: false,
      };

      // WHEN
      const knownDevice = mapDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toEqual({
        id: "ble-id",
        name: null,
        deviceModelId: DeviceModelId.nanoX,
        transport: rnBleTransportIdentifier,
      });
    });
  });

  describe("mapDiscoveredDeviceToKnownDevice", () => {
    it("GIVEN a discovered device WHEN mapping it THEN it keeps the DMK transport", () => {
      // GIVEN
      const device = discoveredNanoX;

      // WHEN
      const knownDevice = mapDiscoveredDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toEqual({
        id: "discovered-ble-id",
        name: "Discovered Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: rnBleTransportIdentifier,
      });
    });

    it("GIVEN a discovered debug device WHEN mapping it THEN it keeps the debug transport", () => {
      // GIVEN
      const device = {
        ...discoveredNanoX,
        id: "httpdebug|ws://127.0.0.1:8435",
        name: "Debug proxy",
        transport: "httpdebug",
      };

      // WHEN
      const knownDevice = mapDiscoveredDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toEqual({
        id: "httpdebug|ws://127.0.0.1:8435",
        name: "Debug proxy",
        deviceModelId: DeviceModelId.nanoX,
        transport: "httpdebug",
      });
    });
  });

  describe("mapBleDeviceToKnownDevice", () => {
    it("GIVEN a legacy BLE device WHEN mapping it THEN it returns a BLE known device", () => {
      // GIVEN
      const device = {
        id: "legacy-ble-id",
        name: "Legacy",
        modelId: DeviceModelId.nanoX,
      };

      // WHEN
      const knownDevice = mapBleDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toEqual({
        id: "legacy-ble-id",
        name: "Legacy",
        deviceModelId: DeviceModelId.nanoX,
        transport: rnBleTransportIdentifier,
      });
    });
  });

  describe("mapKnownDeviceToPersistedKnownDevice", () => {
    it("GIVEN a BLE known device WHEN persisting it THEN it uses the persisted BLE transport name", () => {
      // GIVEN
      const device = nanoX;

      // WHEN
      const persistedDevice = mapKnownDeviceToPersistedKnownDevice(device);

      // THEN
      expect(persistedDevice).toEqual({
        ...nanoX,
        transport: "rnble",
      });
    });

    it("GIVEN a HID known device WHEN persisting it THEN it uses the persisted HID transport name", () => {
      // GIVEN
      const device = flex;

      // WHEN
      const persistedDevice = mapKnownDeviceToPersistedKnownDevice(device);

      // THEN
      expect(persistedDevice).toEqual({
        ...flex,
        transport: "rnhid",
      });
    });

    it("GIVEN an unsupported transport known device WHEN persisting it THEN it returns null", () => {
      // GIVEN
      const device = mapDiscoveredDeviceToKnownDevice({
        ...discoveredNanoX,
        id: "httpdebug|ws://127.0.0.1:8435",
        name: "Debug proxy",
        transport: "httpdebug",
      });

      // WHEN
      const persistedDevice = mapKnownDeviceToPersistedKnownDevice(device);

      // THEN
      expect(persistedDevice).toBeNull();
    });
  });

  describe("mapPersistedKnownDeviceToKnownDevice", () => {
    it("GIVEN a persisted BLE known device WHEN hydrating it THEN it uses the runtime BLE transport identifier", () => {
      // GIVEN
      const device: PersistedKnownDevice = {
        id: "persisted-ble-id",
        name: "Persisted BLE",
        deviceModelId: DeviceModelId.nanoX,
        transport: "rnble",
      };

      // WHEN
      const knownDevice = mapPersistedKnownDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toEqual({
        id: "persisted-ble-id",
        name: "Persisted BLE",
        deviceModelId: DeviceModelId.nanoX,
        transport: rnBleTransportIdentifier,
      });
    });

    it("GIVEN a persisted HID known device WHEN hydrating it THEN it uses the runtime HID transport identifier", () => {
      // GIVEN
      const device: PersistedKnownDevice = {
        id: "persisted-hid-id",
        name: "Persisted HID",
        deviceModelId: DeviceModelId.europa,
        transport: "rnhid",
      };

      // WHEN
      const knownDevice = mapPersistedKnownDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toEqual({
        id: "persisted-hid-id",
        name: "Persisted HID",
        deviceModelId: DeviceModelId.europa,
        transport: rnHidTransportIdentifier,
      });
    });

    it("GIVEN an unsupported persisted transport WHEN hydrating it THEN it returns null", () => {
      // GIVEN
      const device = {
        id: "persisted-unsupported-id",
        name: "Persisted unsupported",
        deviceModelId: DeviceModelId.nanoX,
        transport: "unsupported",
      };

      // WHEN
      const knownDevice = mapPersistedKnownDeviceToKnownDevice(device);

      // THEN
      expect(knownDevice).toBeNull();
    });
  });

  describe("exportSelector", () => {
    it("GIVEN supported runtime transports WHEN exporting known devices THEN it persists transport names", () => {
      // GIVEN
      const rootState = {
        ...rootReducer(undefined, { type: "@@INIT" }),
        knownDevices: { knownDevices: [nanoX, flex] },
      };

      // WHEN
      const persistedState = exportSelector(rootState);

      // THEN
      expect(persistedState).toEqual({
        knownDevices: [
          {
            ...nanoX,
            transport: "rnble",
          },
          {
            ...flex,
            transport: "rnhid",
          },
        ],
      });
    });

    it("GIVEN unsupported runtime transports WHEN exporting known devices THEN it excludes unsupported devices", () => {
      // GIVEN
      const rootState = {
        ...rootReducer(undefined, { type: "@@INIT" }),
        knownDevices: {
          knownDevices: [
            nanoX,
            {
              id: "httpdebug|ws://127.0.0.1:8435",
              name: "Debug proxy",
              deviceModelId: DeviceModelId.nanoX,
              transport: "httpdebug",
            },
            {
              id: "speculos|http://127.0.0.1:5000",
              name: "Speculos",
              deviceModelId: DeviceModelId.nanoX,
              transport: "speculos",
            },
          ],
        },
      };

      // WHEN
      const persistedState = exportSelector(rootState);

      // THEN
      expect(persistedState).toEqual({
        knownDevices: [
          {
            ...nanoX,
            transport: "rnble",
          },
        ],
      });
    });
  });

  describe("knownDevicesSelector", () => {
    it("GIVEN known devices in the slice WHEN selecting known devices THEN it returns the device list", () => {
      // GIVEN
      const slice = { knownDevices: [nanoX, flex] };
      const rootState = {
        ...rootReducer(undefined, { type: "@@INIT" }),
        knownDevices: slice,
      };

      // WHEN
      const knownDevices = knownDevicesSelector(rootState);

      // THEN
      expect(knownDevices).toBe(slice.knownDevices);
    });
  });
});
