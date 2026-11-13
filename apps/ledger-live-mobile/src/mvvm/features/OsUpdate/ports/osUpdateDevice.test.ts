import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import {
  getOsUpdateDeviceModel,
  toDmkDevice,
  toMyLedgerDevice,
  toOsUpdateDevice,
} from "./osUpdateDevice";

describe("getOsUpdateDeviceModel", () => {
  it("maps a DMK model to the Ledger Wallet model the flow shows and tracks", () => {
    expect(getOsUpdateDeviceModel(DmkDeviceModelId.FLEX)).toMatchObject({
      productName: getDeviceModel(DeviceModelId.europa).productName,
      actionModelId: "europa",
      analyticsModelId: "europa",
    });
  });
});

describe("device conversions", () => {
  const dmkDevice = {
    id: "usb|1",
    name: "My Stax",
    deviceModelId: DeviceModelId.stax,
    transport: rnHidTransportIdentifier,
  };

  it("gives the flow the DMK model and the connection of the route device", () => {
    expect(toOsUpdateDevice(dmkDevice)).toEqual({
      id: "usb|1",
      name: "My Stax",
      modelId: DmkDeviceModelId.STAX,
      wired: true,
    });
    expect(toOsUpdateDevice({ ...dmkDevice, transport: rnBleTransportIdentifier }).wired).toBe(
      false,
    );
  });

  it("gives My Ledger back the device it connected", () => {
    expect(toMyLedgerDevice(toOsUpdateDevice(dmkDevice))).toEqual({
      deviceId: "usb|1",
      deviceName: "My Stax",
      modelId: DeviceModelId.stax,
      wired: true,
    });
  });

  it("opens the OS update screen with the device of My Ledger", () => {
    expect(
      toDmkDevice({
        deviceId: "usb|1",
        deviceName: "My Stax",
        modelId: DeviceModelId.stax,
        wired: true,
      }),
    ).toEqual(dmkDevice);
  });
});
