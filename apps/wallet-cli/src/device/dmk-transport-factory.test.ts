import { afterEach, describe, expect, it } from "bun:test";
import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  DeviceModelId,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import { firstValueFrom } from "rxjs";
import { walletCliTransportFactory } from "./dmk-transport-factory";

const usb: TransportFactory = () => {
  throw new Error("USB transport must not be built on Speculos");
};
let dmk: DeviceManagementKit | undefined;

afterEach(() => {
  dmk?.close();
  dmk = undefined;
});

describe("walletCliTransportFactory", () => {
  it("keeps the USB factory without a Speculos configuration", () => {
    expect(walletCliTransportFactory(usb, null)).toBe(usb);
  });

  it("builds a Speculos transport that discovers the configured model", async () => {
    const factory = walletCliTransportFactory(usb, {
      url: "http://127.0.0.1:40000",
      deviceModelId: DeviceModelId.NANO_SP,
    });
    dmk = new DeviceManagementKitBuilder().addTransport(factory).build();

    const [device] = await firstValueFrom(dmk.listenToAvailableDevices({}));

    expect(device?.transport).toBe(speculosIdentifier);
    expect(device?.deviceModel.model).toBe(DeviceModelId.NANO_SP);
  });
});
