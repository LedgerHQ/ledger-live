import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { getEnv, setEnv } from "@shared/env";
import {
  buildMockServerDeviceConfig,
  defaultMockServerDeviceSelection,
  MOCK_SERVER_DEVICE_MODELS,
  MOCK_SERVER_DEVICE_MODEL_IDS,
  MOCK_SERVER_DEVICE_STORAGE_KEY,
  mockServerSessionImport,
  readMockServerDevice,
  writeMockServerDevice,
} from "./mockServerDevice";

const FLEX_OS = MOCK_SERVER_DEVICE_MODELS[DeviceModelId.FLEX].defaultOsVersion;
const NANO_X_OS = MOCK_SERVER_DEVICE_MODELS[DeviceModelId.NANO_X].defaultOsVersion;

describe("mock server device catalogue", () => {
  const defaultSession = getEnv("MOCK_SERVER_SESSION");

  afterEach(() => {
    window.localStorage.clear();
    setEnv("MOCK_SERVER_SESSION", defaultSession);
  });

  it("covers every device model the DMK knows", () => {
    expect(MOCK_SERVER_DEVICE_MODEL_IDS.sort()).toEqual(Object.values(DeviceModelId).sort());
  });

  describe("defaultMockServerDeviceSelection", () => {
    it("starts an onboarded Stax on its latest OS version", () => {
      expect(defaultMockServerDeviceSelection()).toEqual({
        model: DeviceModelId.STAX,
        onboarded: true,
        osVersion: MOCK_SERVER_DEVICE_MODELS[DeviceModelId.STAX].defaultOsVersion,
      });
    });

    it("takes the OS version of the model it is given", () => {
      expect(defaultMockServerDeviceSelection(DeviceModelId.NANO_X)).toEqual({
        model: DeviceModelId.NANO_X,
        onboarded: true,
        osVersion: NANO_X_OS,
      });
    });
  });

  describe("buildMockServerDeviceConfig", () => {
    it("describes the picked model", () => {
      expect(
        buildMockServerDeviceConfig(defaultMockServerDeviceSelection(DeviceModelId.FLEX)),
      ).toEqual({
        name: "Ledger Flex",
        device_type: "flex",
        connectivity_type: "USB",
        firmware_version: FLEX_OS,
        apps: [{ name: "BOLOS", version: FLEX_OS }],
        masks: [0x33300000],
        onboarded: true,
      });
    });

    it("asks for the onboarding simulation when not onboarded", () => {
      expect(
        buildMockServerDeviceConfig({
          ...defaultMockServerDeviceSelection(DeviceModelId.STAX),
          onboarded: false,
        }),
      ).toEqual(expect.objectContaining({ device_type: "stax", onboarded: false }));
    });

    it("reports the configured OS version, so an update stays available", () => {
      expect(
        buildMockServerDeviceConfig({
          model: DeviceModelId.STAX,
          onboarded: true,
          osVersion: "1.9.1",
        }),
      ).toEqual(
        expect.objectContaining({
          firmware_version: "1.9.1",
          apps: [{ name: "BOLOS", version: "1.9.1" }],
        }),
      );
    });

    it("carries no APDU mock, which the mock server derives itself", () => {
      setEnv("MOCK_SERVER_SESSION", {
        devices: [
          {
            name: "whatever",
            device_type: "nanoS",
            connectivity_type: "BLE",
            mocks: [{ prefix: "e001", response: "9000" }],
            catalog: [{ hash: "aa", name: "Bitcoin", version: "2.5.0" }],
          },
        ],
      });

      const config = buildMockServerDeviceConfig(
        defaultMockServerDeviceSelection(DeviceModelId.NANO_X),
      );

      expect(config).not.toHaveProperty("mocks");
      expect(config).not.toHaveProperty("catalog");
      expect(config).toEqual(
        expect.objectContaining({
          name: "Ledger Nano X",
          device_type: "nanoX",
          connectivity_type: "USB",
        }),
      );
    });
  });

  describe("persistence", () => {
    it("round-trips a selection", () => {
      const selection = {
        model: DeviceModelId.NANO_SP,
        onboarded: false,
        osVersion: "1.5.1",
      };
      writeMockServerDevice(selection);

      expect(readMockServerDevice()).toEqual(selection);
    });

    it("reports no selection until one is written", () => {
      expect(readMockServerDevice()).toBeNull();
    });

    it("falls back to the model's OS version when none was stored", () => {
      window.localStorage.setItem(
        MOCK_SERVER_DEVICE_STORAGE_KEY,
        JSON.stringify({ model: DeviceModelId.NANO_X, onboarded: true }),
      );

      expect(readMockServerDevice()).toEqual({
        model: DeviceModelId.NANO_X,
        onboarded: true,
        osVersion: NANO_X_OS,
      });
    });

    it("ignores a stored value it cannot trust", () => {
      window.localStorage.setItem(MOCK_SERVER_DEVICE_STORAGE_KEY, "not json");
      expect(readMockServerDevice()).toBeNull();

      window.localStorage.setItem(
        MOCK_SERVER_DEVICE_STORAGE_KEY,
        JSON.stringify({ model: "typo", onboarded: true }),
      );
      expect(readMockServerDevice()).toBeNull();
    });
  });

  describe("mockServerSessionImport", () => {
    it("imports the session env var while no device has been picked", () => {
      expect(mockServerSessionImport()).toEqual(defaultSession);
    });

    it("imports the picked device once there is one", () => {
      const selection = {
        model: DeviceModelId.FLEX,
        onboarded: false,
        osVersion: "1.5.1",
      };
      writeMockServerDevice(selection);

      expect(mockServerSessionImport()).toEqual({
        devices: [buildMockServerDeviceConfig(selection)],
      });
    });
  });
});
