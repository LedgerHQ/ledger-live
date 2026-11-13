import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { findMatchingDevice } from "./findMatchingDevice";

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
  transport: rnBleTransportIdentifier,
  deviceModelId: DeviceModelId.nanoX,
  id: "device-id",
  name: "Ledger Nano X ABCD",
  ...overrides,
});

describe("findMatchingDevice", () => {
  it("should return null when the candidate is on another transport", () => {
    const device = makeDevice({ transport: rnHidTransportIdentifier });
    const candidate = makeDevice({ transport: rnBleTransportIdentifier });

    expect(findMatchingDevice(device, [candidate])).toBeNull();
  });

  it("should return null when the transport has no matching rule", () => {
    const device = makeDevice({ transport: "httpdebug" });

    expect(findMatchingDevice(device, [makeDevice({ transport: "httpdebug" })])).toBeNull();
  });

  describe("mock server", () => {
    const makeMockServerDevice = (overrides: Partial<Device> = {}) =>
      makeDevice({ transport: mockserverIdentifier, id: "mock-device-1", ...overrides });

    it("should match the candidate with the same stable id", () => {
      const device = makeMockServerDevice();
      const otherDevice = makeMockServerDevice({ id: "mock-device-2" });
      const sameDevice = makeMockServerDevice({ name: "Renamed" });

      expect(findMatchingDevice(device, [otherDevice, sameDevice])).toBe(sameDevice);
    });

    it("should not match a candidate of the same model with another stable id", () => {
      const device = makeMockServerDevice();
      const otherDevice = makeMockServerDevice({ id: "mock-device-2" });

      expect(findMatchingDevice(device, [otherDevice])).toBeNull();
    });

    it("should match a candidate without id by model", () => {
      const device = makeMockServerDevice();
      const placeholder = makeMockServerDevice({ id: "", name: null });

      expect(findMatchingDevice(device, [placeholder])).toBe(placeholder);
    });

    it("should match a device without id by model", () => {
      const device = makeMockServerDevice({ id: "" });
      const candidate = makeMockServerDevice();

      expect(findMatchingDevice(device, [candidate])).toBe(candidate);
    });

    it("should not match a candidate without id when the model differs", () => {
      const device = makeMockServerDevice();
      const placeholder = makeMockServerDevice({ id: "", deviceModelId: DeviceModelId.stax });

      expect(findMatchingDevice(device, [placeholder])).toBeNull();
    });

    it("should prefer the candidate with the same id over a candidate without id", () => {
      const device = makeMockServerDevice();
      const placeholder = makeMockServerDevice({ id: "" });
      const sameDevice = makeMockServerDevice();

      expect(findMatchingDevice(device, [placeholder, sameDevice])).toBe(sameDevice);
    });
  });

  describe.each([
    ["USB", rnHidTransportIdentifier],
    ["Speculos", speculosIdentifier],
  ])("%s", (_, transport) => {
    it("should match a candidate of the same model with another id", () => {
      const device = makeDevice({ transport, id: "new-id" });
      const candidate = makeDevice({ transport, id: "old-id" });

      expect(findMatchingDevice(device, [candidate])).toBe(candidate);
    });

    it("should not match a candidate of another model with the same id", () => {
      const device = makeDevice({ transport });
      const candidate = makeDevice({ transport, deviceModelId: DeviceModelId.stax });

      expect(findMatchingDevice(device, [candidate])).toBeNull();
    });
  });

  describe("BLE", () => {
    it("should match a candidate with the same id and another name", () => {
      const device = makeDevice({ name: "Renamed" });
      const candidate = makeDevice();

      expect(findMatchingDevice(device, [candidate])).toBe(candidate);
    });

    it("should match a candidate with the old default name when the device has the new one", () => {
      const device = makeDevice({ id: "new-ble-address", name: "ABCD" });
      const candidate = makeDevice({ id: "old-ble-address", name: "Ledger Nano X ABCD" });

      expect(findMatchingDevice(device, [candidate])).toBe(candidate);
    });

    it("should not match a candidate with the new default name when the device has the old one", () => {
      const device = makeDevice({ id: "old-ble-address", name: "Ledger Nano X ABCD" });
      const candidate = makeDevice({ id: "new-ble-address", name: "ABCD" });

      expect(findMatchingDevice(device, [candidate])).toBeNull();
    });

    it("should not match a candidate with another id and another name", () => {
      const device = makeDevice({ id: "ble-address-1", name: "ABCD" });
      const candidate = makeDevice({ id: "ble-address-2", name: "Ledger Nano X EF12" });

      expect(findMatchingDevice(device, [candidate])).toBeNull();
    });

    it("should not match a candidate of another model with the same id and name", () => {
      const device = makeDevice();
      const candidate = makeDevice({ deviceModelId: DeviceModelId.nanoSP });

      expect(findMatchingDevice(device, [candidate])).toBeNull();
    });

    it("should prefer a match by id over a match by name on an earlier candidate", () => {
      const device = makeDevice({ id: "ble-address-1", name: "ABCD" });
      const matchByName = makeDevice({ id: "ble-address-2", name: "Ledger Nano X ABCD" });
      const matchById = makeDevice({ id: "ble-address-1", name: "Custom name" });

      expect(findMatchingDevice(device, [matchByName, matchById])).toBe(matchById);
    });
  });
});
