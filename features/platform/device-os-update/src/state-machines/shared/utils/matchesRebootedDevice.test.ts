import {
  DeviceModelId,
  type ConnectedDevice,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { matchesRebootedDevice } from "./matchesRebootedDevice";

const bleDevice = (overrides: Partial<ConnectedDevice> = {}): ConnectedDevice =>
  ({
    id: "ble-address",
    sessionId: "session-id",
    modelId: DeviceModelId.STAX,
    name: "Ledger Stax 123A",
    transport: "RN_BLE",
    ...overrides,
  }) as ConnectedDevice;

const usbDevice = (overrides: Partial<ConnectedDevice> = {}): ConnectedDevice =>
  bleDevice({ id: "native-session-id", transport: "RN_HID", ...overrides });

const discovered = (overrides: Partial<DiscoveredDevice> = {}): DiscoveredDevice =>
  ({
    id: "discovered-id",
    name: "123A",
    deviceModel: { id: "discovered-id", model: DeviceModelId.STAX, name: "Stax" },
    transport: "RN_BLE",
    ...overrides,
  }) as DiscoveredDevice;

describe("matchesRebootedDevice", () => {
  it("should reject a device of another model", () => {
    expect(
      matchesRebootedDevice(
        bleDevice(),
        discovered({
          deviceModel: { id: "discovered-id", model: DeviceModelId.FLEX, name: "Flex" },
        } as Partial<DiscoveredDevice>),
      ),
    ).toBe(false);
  });

  describe("BLE", () => {
    it("should match the same address", () => {
      expect(
        matchesRebootedDevice(bleDevice(), discovered({ id: "ble-address", name: "whatever" })),
      ).toBe(true);
    });

    it("should match a new address when the name carried over", () => {
      expect(matchesRebootedDevice(bleDevice(), discovered({ id: "new-address" }))).toBe(true);
    });

    it("should reject a new address whose name does not match", () => {
      expect(
        matchesRebootedDevice(bleDevice(), discovered({ id: "new-address", name: "BEEF" })),
      ).toBe(false);
    });
  });

  describe("HID", () => {
    // The connected id is the transport's session id and the uid changes on re-enumeration, so
    // neither is comparable and the model has to be enough.
    it("should match on the model alone, whatever the uid", () => {
      expect(
        matchesRebootedDevice(
          usbDevice(),
          discovered({ id: "re-enumerated-uid", name: "", transport: "RN_HID" }),
        ),
      ).toBe(true);
    });

    it("should still reject another model", () => {
      expect(
        matchesRebootedDevice(
          usbDevice(),
          discovered({
            id: "re-enumerated-uid",
            transport: "RN_HID",
            deviceModel: { id: "re-enumerated-uid", model: DeviceModelId.NANO_X, name: "Nano X" },
          } as Partial<DiscoveredDevice>),
        ),
      ).toBe(false);
    });
  });
});
