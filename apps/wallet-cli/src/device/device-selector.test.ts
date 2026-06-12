import { afterEach, describe, expect, it } from "bun:test";
import {
  deviceMatchesSelector,
  resolveDeviceSelector,
  selectDiscoveredDevice,
  setDeviceSelectorOverride,
  type SelectableDevice,
} from "./device-selector";
import { chooseConnectTransport } from "./register-dmk-transport";

function device(id: string, name = ""): SelectableDevice {
  return { id, name };
}

const flex = device("ble-aaa", "Solmaria");
const stax = device("ble-bbb", "Pavel's Stax");
const unnamed = device("usb-ccc");

afterEach(() => {
  delete process.env.WALLET_CLI_DEVICE;
  setDeviceSelectorOverride(null);
});

describe("resolveDeviceSelector", () => {
  it("returns null when unset or blank", () => {
    delete process.env.WALLET_CLI_DEVICE;
    expect(resolveDeviceSelector()).toBeNull();
    process.env.WALLET_CLI_DEVICE = "   ";
    expect(resolveDeviceSelector()).toBeNull();
  });

  it("trims and returns the selector when set", () => {
    process.env.WALLET_CLI_DEVICE = "  Solmaria  ";
    expect(resolveDeviceSelector()).toBe("Solmaria");
  });

  it("prefers the --device override over the env var", () => {
    process.env.WALLET_CLI_DEVICE = "from-env";
    setDeviceSelectorOverride("from-flag");
    expect(resolveDeviceSelector()).toBe("from-flag");
    setDeviceSelectorOverride("  ");
    expect(resolveDeviceSelector()).toBe("from-env");
  });
});

describe("deviceMatchesSelector", () => {
  it("matches by exact id", () => {
    expect(deviceMatchesSelector(flex, "ble-aaa")).toBe(true);
    expect(deviceMatchesSelector(flex, "ble-zzz")).toBe(false);
  });

  it("matches by case-insensitive name substring", () => {
    expect(deviceMatchesSelector(flex, "solmaria")).toBe(true);
    expect(deviceMatchesSelector(flex, "SOLMARIA")).toBe(true);
    expect(deviceMatchesSelector(flex, "sol")).toBe(true);
    expect(deviceMatchesSelector(stax, "nano")).toBe(false);
    expect(deviceMatchesSelector(device("usb-1", "Ledger Nano S Plus"), "nano")).toBe(true);
  });

  it("matches by id prefix", () => {
    expect(deviceMatchesSelector(flex, "ble-a")).toBe(true);
    expect(deviceMatchesSelector(flex, "ble-b")).toBe(false);
  });

  it("does not match an unnamed device by name", () => {
    expect(deviceMatchesSelector(unnamed, "anything")).toBe(false);
    expect(deviceMatchesSelector(unnamed, "usb-ccc")).toBe(true);
  });

  it("tolerates a device whose name is undefined (raw DMK discovery)", () => {
    const nameless: SelectableDevice = { id: "ble-ddd" };
    expect(deviceMatchesSelector(nameless, "anything")).toBe(false);
    expect(deviceMatchesSelector(nameless, "ble-ddd")).toBe(true);
    expect(selectDiscoveredDevice([nameless], "ble-ddd")).toBe(nameless);
    expect(() => selectDiscoveredDevice([nameless, flex], null)).toThrow(/\(unnamed\)/);
  });
});

describe("selectDiscoveredDevice", () => {
  it("throws when nothing was discovered", () => {
    expect(() => selectDiscoveredDevice([], null)).toThrow("No Ledger device found");
  });

  it("returns the only device when there is no selector", () => {
    expect(selectDiscoveredDevice([flex], null)).toBe(flex);
  });

  it("refuses to guess between multiple devices without a selector", () => {
    expect(() => selectDiscoveredDevice([flex, stax], null)).toThrow(
      /Multiple Ledger devices found.*Solmaria.*Stax.*--device/s,
    );
  });

  it("selects the matching device by name", () => {
    expect(selectDiscoveredDevice([flex, stax], "Solmaria")).toBe(flex);
  });

  it("selects the matching device by id", () => {
    expect(selectDiscoveredDevice([flex, stax], "ble-bbb")).toBe(stax);
  });

  it("throws with the candidate list when the selector matches nothing", () => {
    expect(() => selectDiscoveredDevice([flex, stax], "Nano")).toThrow(
      /No Ledger device matching "Nano".*Solmaria.*Stax/s,
    );
  });

  it("throws when the selector is ambiguous across devices", () => {
    const twins = [device("id-1", "Ledger"), device("id-2", "Ledger")];
    expect(() => selectDiscoveredDevice(twins, "Ledger")).toThrow(/matches multiple devices/);
  });
});

describe("chooseConnectTransport", () => {
  const usbNano = { id: "usb-1", name: "Ledger Nano S Plus", model: "nanoSP", transport: "usb" };
  const bleFlex = { id: "17cb-aaa", name: "Solmaria", model: "flex", transport: "ble" };

  it("infers the transport of the selector match", () => {
    expect(chooseConnectTransport([usbNano, bleFlex], "nano")).toBe("usb");
    expect(chooseConnectTransport([usbNano, bleFlex], "sol")).toBe("ble");
    expect(chooseConnectTransport([usbNano, bleFlex], "17cb")).toBe("ble");
  });

  it("uses the only device when there is no selector", () => {
    expect(chooseConnectTransport([bleFlex], null)).toBe("ble");
  });

  it("refuses to guess between several devices without a selector", () => {
    expect(() => chooseConnectTransport([usbNano, bleFlex], null)).toThrow(
      /Multiple Ledger devices found.*--device/s,
    );
  });

  it("throws when the selector matches nothing, listing candidates", () => {
    expect(() => chooseConnectTransport([usbNano, bleFlex], "zzz")).toThrow(
      /No Ledger device matching "zzz".*Nano.*Solmaria/s,
    );
  });

  it("throws when the selector matches devices on multiple transports", () => {
    const dup = { id: "usb-9", name: "Solmaria", model: "nanoSP", transport: "usb" };
    expect(() => chooseConnectTransport([bleFlex, dup], "Solmaria")).toThrow(
      /multiple transports/,
    );
  });
});
