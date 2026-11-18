import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { selectKnownDevicesToReconnect } from "./reconnectDevices";

const bleStax: KnownDevice = {
  id: "ble-stax",
  name: "Ledger Stax 1A2B",
  transport: rnBleTransportIdentifier,
  deviceModelId: DeviceModelId.stax,
};
const otherBleStax: KnownDevice = {
  id: "ble-other-stax",
  name: "Ledger Stax 9F9F",
  transport: rnBleTransportIdentifier,
  deviceModelId: DeviceModelId.stax,
};
const bleNanoX: KnownDevice = {
  id: "ble-nano-x",
  name: "Ledger Nano X 3C4D",
  transport: rnBleTransportIdentifier,
  deviceModelId: DeviceModelId.nanoX,
};
const usbNanoX: KnownDevice = {
  id: "hid-1",
  name: null,
  transport: rnHidTransportIdentifier,
  deviceModelId: DeviceModelId.nanoX,
};

const updatedBleStax: Device = {
  deviceId: "ble-stax",
  deviceName: "Ledger Stax 1A2B",
  modelId: DeviceModelId.stax,
  wired: false,
};

describe("selectKnownDevicesToReconnect", () => {
  it("should offer no device when the updated device is unknown", () => {
    expect(selectKnownDevicesToReconnect([bleStax, bleNanoX], null)).toEqual([]);
  });

  it("should keep only the updated device among several known devices", () => {
    expect(
      selectKnownDevicesToReconnect([bleNanoX, otherBleStax, bleStax], updatedBleStax),
    ).toEqual([bleStax]);
  });

  it("should match the updated device by name when its address changed", () => {
    const rebootedStax: KnownDevice = { ...bleStax, id: "ble-stax-new-address", name: "1A2B" };
    expect(selectKnownDevicesToReconnect([otherBleStax, rebootedStax], updatedBleStax)).toEqual([
      rebootedStax,
    ]);
  });

  it("should keep the wired device of the same model after a USB update", () => {
    const updatedUsbNanoX: Device = {
      deviceId: "usb|hid-1",
      deviceName: undefined,
      modelId: DeviceModelId.nanoX,
      wired: true,
    };
    expect(selectKnownDevicesToReconnect([bleStax, usbNanoX], updatedUsbNanoX)).toEqual([usbNanoX]);
  });

  it("should keep every known device when none matches the updated device", () => {
    expect(selectKnownDevicesToReconnect([bleNanoX, otherBleStax], updatedBleStax)).toEqual([
      bleNanoX,
      otherBleStax,
    ]);
  });
});
