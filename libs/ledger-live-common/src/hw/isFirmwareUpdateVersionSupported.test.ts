import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { isBleUpdateSupported, isUsbUpdateSupported } from "./isFirmwareUpdateVersionSupported";

const usbSupportedDataset: { [key in DeviceModelId]?: string[] } = {
  nanoS: ["2.0.0", "3.0.0"],
  nanoX: ["1.3.0", "1.3.0-rc1"],
  nanoSP: ["1.0.0", "1.0.0-0", "1.1.1", "1.4.0", "1.1.0-rc1", "1.1.0-rc2"],
  stax: ["1.0.0", "1.0.0rc2", "2.0.2-il0", "1.0.0-rc4"],
};

const usbNotSupportedDataset: { [key in DeviceModelId]?: string[] } = {
  nanoS: ["1.6.0", "1.5.5", "1.5.5-wadus"],
  nanoX: ["1.2.4-5", "1.0.0"],
  nanoSP: ["0.9.9", "0.9.0-rc3"],
  stax: ["0.4.6", "0.0.9-rc.2"],
};

const bleSupportedDataset: { [key in DeviceModelId]?: string[] } = {
  nanoX: ["2.4.0", "2.4.0-rc1"],
  stax: ["0.0.0", "0.0.0-rc1"],
  europa: ["0.0.0", "0.0.0-rc1"],
  apex: ["0.0.0", "0.0.0-rc1"],
};

const bleNotSupportedDataset: { [key in DeviceModelId]?: string[] } = {
  nanoX: ["2.3.0", "2.3.0-rc1"],
  nanoSP: ["1.0.0", "1.0.0-rc1"],
  nanoS: ["1.6.1", "1.6.0"],
};

describe("Firmware update version availability checks", () => {
  const getDeviceInfo = (version): DeviceInfo => ({
    version,
    mcuVersion: "0.0",
    majMin: "0.0",
    providerName: null,
    targetId: 823132162,
    isOSU: false,
    isBootloader: false,
    managerAllowed: false,
    pinValidated: false,
    seFlags: Buffer.alloc(0),
  });

  describe("USB update not supported", () => {
    Object.keys(usbNotSupportedDataset).forEach(deviceModelId => {
      usbNotSupportedDataset[deviceModelId].forEach(version => {
        const deviceInfo = getDeviceInfo(version);
        it(`testing ${version} for ${deviceModelId}`, () =>
          expect(isUsbUpdateSupported(deviceInfo, deviceModelId as DeviceModelId)).toBe(false));
      });
    });
  });

  describe("USB update supported", () => {
    Object.keys(usbSupportedDataset).forEach(deviceModelId => {
      usbSupportedDataset[deviceModelId].forEach(version => {
        const deviceInfo = getDeviceInfo(version);
        it(`testing ${version} for ${deviceModelId}`, () =>
          expect(isUsbUpdateSupported(deviceInfo, deviceModelId as DeviceModelId)).toBe(true));
      });
    });
  });

  describe("BLE update not supported", () => {
    Object.keys(bleNotSupportedDataset).forEach(deviceModelId => {
      bleNotSupportedDataset[deviceModelId].forEach(version => {
        const deviceInfo = getDeviceInfo(version);
        it(`testing ${version} for ${deviceModelId}`, () =>
          expect(isBleUpdateSupported(deviceInfo, deviceModelId as DeviceModelId)).toBe(false));
      });
    });
  });

  describe("BLE update supported", () => {
    Object.keys(bleSupportedDataset).forEach(deviceModelId => {
      bleSupportedDataset[deviceModelId].forEach(version => {
        const deviceInfo = getDeviceInfo(version);
        it(`testing ${version} for ${deviceModelId}`, () =>
          expect(isBleUpdateSupported(deviceInfo, deviceModelId as DeviceModelId)).toBe(true));
      });
    });
  });
});
