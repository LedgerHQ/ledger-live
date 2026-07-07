import {
  DeviceModelId as DMKDeviceModelId,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { webHidIdentifier as webHidTransportIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";

import { BaseConnectionErrorTypes } from "./types";
import { createConnectionError, filterMatchedDevices } from "./utils";

const knownDeviceA: KnownDevice = {
  transport: webHidTransportIdentifier,
  deviceModelId: DeviceModelId.nanoX,
  id: "",
  name: "Ledger Nano X",
};

const knownDeviceB: KnownDevice = {
  transport: webHidTransportIdentifier,
  deviceModelId: DeviceModelId.nanoSP,
  id: "",
  name: "Ledger Nano S Plus",
};

const makeDiscoveredDevice = ({
  id = "discovered-device-a",
  name = "Ledger Nano X",
  model = DMKDeviceModelId.NANO_X,
  deviceModelId = DeviceModelId.nanoX,
  transport = webHidTransportIdentifier,
}: {
  id?: string;
  name?: string;
  model?: DMKDeviceModelId;
  deviceModelId?: DiscoveredDevice["deviceModel"]["id"];
  transport?: DiscoveredDevice["transport"];
} = {}): DiscoveredDevice =>
  ({
    id,
    name,
    deviceModel: {
      id: deviceModelId,
      model,
      name,
    },
    transport,
  }) as DiscoveredDevice;

describe("desktop connectDevice utils", () => {
  describe("filterMatchedDevices", () => {
    it("GIVEN a WebHID known device with the same model, WHEN filtering, THEN it should match", () => {
      // GIVEN
      const discoveredDevice = makeDiscoveredDevice();

      // WHEN / THEN
      expect(filterMatchedDevices([discoveredDevice], [knownDeviceA])).toEqual([
        { knownDevice: knownDeviceA, discoveredDevice },
      ]);
    });

    it("GIVEN a legacy lowercase WebHID transport, WHEN filtering, THEN it should not match", () => {
      // GIVEN
      const discoveredDevice = makeDiscoveredDevice({ transport: "web-hid" });

      // WHEN / THEN
      expect(filterMatchedDevices([discoveredDevice], [knownDeviceA])).toEqual([]);
    });

    it("GIVEN a WebHID known device with another model, WHEN filtering, THEN it should not match", () => {
      // GIVEN
      const discoveredDevice = makeDiscoveredDevice();

      // WHEN / THEN
      expect(filterMatchedDevices([discoveredDevice], [knownDeviceB])).toEqual([]);
    });

    it("GIVEN a discovered device from another transport, WHEN filtering, THEN it should not match", () => {
      // GIVEN
      const discoveredDevice = makeDiscoveredDevice({ transport: "ble" });

      // WHEN / THEN
      expect(filterMatchedDevices([discoveredDevice], [knownDeviceA])).toEqual([]);
    });

    it("GIVEN multiple discovered devices, WHEN filtering, THEN it should return the matching models only", () => {
      // GIVEN
      const unmatchedDiscoveredDevice = makeDiscoveredDevice({
        model: DMKDeviceModelId.STAX,
        deviceModelId: DeviceModelId.stax,
      });
      const matchedDiscoveredDevice = makeDiscoveredDevice({
        id: "nano-sp",
        name: "Ledger Nano S Plus",
        model: DMKDeviceModelId.NANO_SP,
        deviceModelId: DeviceModelId.nanoSP,
      });

      // WHEN / THEN
      expect(
        filterMatchedDevices([unmatchedDiscoveredDevice, matchedDiscoveredDevice], [knownDeviceB]),
      ).toEqual([{ knownDevice: knownDeviceB, discoveredDevice: matchedDiscoveredDevice }]);
    });
  });

  describe("createConnectionError", () => {
    it("GIVEN any connection error, WHEN mapping it, THEN it should return an unknown error", () => {
      // GIVEN
      const error = new Error("unknown error");

      // WHEN / THEN
      expect(createConnectionError(error)).toEqual({
        type: BaseConnectionErrorTypes.Unknown,
        error,
      });
    });
  });
});
