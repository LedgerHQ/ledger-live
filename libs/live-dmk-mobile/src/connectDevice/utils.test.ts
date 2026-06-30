import {
  DeviceModelId as DMKDeviceModelId,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import {
  PairingRefusedError,
  rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PeerRemovedPairing } from "@ledgerhq/errors";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";

import { BaseConnectionErrorTypes, ConnectionErrorTypes } from "./types";
import { createConnectionError, filterMatchedDevices } from "./utils";

const knownDeviceA: KnownDevice = {
  transport: rnBleTransportIdentifier,
  deviceModelId: DeviceModelId.nanoX,
  id: "known-device-a",
  name: "Ledger Nano X",
};

const knownDeviceB: KnownDevice = {
  transport: rnBleTransportIdentifier,
  deviceModelId: DeviceModelId.nanoSP,
  id: "known-device-b",
  name: "Ledger Nano S Plus",
};

const makeDiscoveredDevice = ({
  id = "discovered-device-a",
  name = "Ledger Nano X",
  model = DMKDeviceModelId.NANO_X,
  deviceModelId = DeviceModelId.nanoX,
  transport = rnBleTransportIdentifier,
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

describe("mobile connectDevice utils", () => {
  describe("filterMatchedDevices", () => {
    it("should match USB known devices by mapped DMK device model", () => {
      const knownDevice: KnownDevice = {
        ...knownDeviceA,
        deviceModelId: DeviceModelId.nanoSP,
        transport: rnHidTransportIdentifier,
      };
      const discoveredDevice = makeDiscoveredDevice({
        deviceModelId: DMKDeviceModelId.NANO_SP,
        model: DMKDeviceModelId.NANO_SP,
        transport: rnHidTransportIdentifier,
      });

      expect(filterMatchedDevices([discoveredDevice], [knownDevice])).toEqual([
        { knownDevice, discoveredDevice },
      ]);
    });

    it("should not match USB known devices when device model id differs", () => {
      const knownDevice: KnownDevice = {
        ...knownDeviceB,
        transport: rnHidTransportIdentifier,
      };
      const discoveredDevice = makeDiscoveredDevice({
        deviceModelId: DMKDeviceModelId.NANO_X,
        model: DMKDeviceModelId.NANO_X,
        transport: rnHidTransportIdentifier,
      });

      expect(filterMatchedDevices([discoveredDevice], [knownDevice])).toEqual([]);
    });

    it("should not match discovered devices when transport differs", () => {
      const discoveredDevice = makeDiscoveredDevice({
        transport: rnHidTransportIdentifier,
      });

      expect(filterMatchedDevices([discoveredDevice], [knownDeviceA])).toEqual([]);
    });

    it("should match BLE known devices by stable id", () => {
      const discoveredDevice = makeDiscoveredDevice({
        id: knownDeviceA.id,
        name: "Renamed Nano",
        transport: rnBleTransportIdentifier,
      });

      expect(filterMatchedDevices([discoveredDevice], [knownDeviceA])).toEqual([
        { knownDevice: knownDeviceA, discoveredDevice },
      ]);
    });

    it("should match BLE known devices by old and new default names", () => {
      const knownDevice: KnownDevice = {
        ...knownDeviceA,
        id: "old-ble-address",
        name: "Ledger Nano X ABCD",
      };
      const discoveredDevice = makeDiscoveredDevice({
        id: "new-ble-address",
        name: "ABCD",
        transport: rnBleTransportIdentifier,
      });

      expect(filterMatchedDevices([discoveredDevice], [knownDevice])).toEqual([
        { knownDevice, discoveredDevice },
      ]);
    });

    it("should only return the discovered BLE device that matches the known device", () => {
      const knownDevice: KnownDevice = {
        ...knownDeviceA,
        id: "old-ble-address",
        name: "Ledger Nano X ABCD",
      };
      const unmatchedDiscoveredDevice = makeDiscoveredDevice({
        id: "other-ble-address",
        name: "EF12",
        transport: rnBleTransportIdentifier,
      });
      const matchedDiscoveredDevice = makeDiscoveredDevice({
        id: "new-ble-address",
        name: "ABCD",
        transport: rnBleTransportIdentifier,
      });

      expect(
        filterMatchedDevices([unmatchedDiscoveredDevice, matchedDiscoveredDevice], [knownDevice]),
      ).toEqual([{ knownDevice, discoveredDevice: matchedDiscoveredDevice }]);
    });

    it("should not match BLE devices when model differs", () => {
      const knownDevice: KnownDevice = {
        ...knownDeviceA,
        id: "old-ble-address",
        name: "Ledger Nano X ABCD",
      };
      const discoveredDevice = makeDiscoveredDevice({
        id: "new-ble-address",
        name: "ABCD",
        model: DMKDeviceModelId.NANO_SP,
        deviceModelId: DeviceModelId.nanoSP,
        transport: rnBleTransportIdentifier,
      });

      expect(filterMatchedDevices([discoveredDevice], [knownDevice])).toEqual([]);
    });
  });

  describe("createConnectionError", () => {
    it("should return BLE pairing refused error if error is PairingRefusedError", () => {
      expect(createConnectionError(new PairingRefusedError())).toEqual({
        type: ConnectionErrorTypes.BlePairingRefused,
      });
    });

    it("should return BLE peer removed pairing error if error is PeerRemovedPairing", () => {
      expect(createConnectionError(new PeerRemovedPairing())).toEqual({
        type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
      });
    });

    it("should return unknown error if error is not handled", () => {
      const error = new Error("unknown error");

      expect(createConnectionError(error)).toEqual({
        type: BaseConnectionErrorTypes.Unknown,
        error,
      });
    });
  });
});
