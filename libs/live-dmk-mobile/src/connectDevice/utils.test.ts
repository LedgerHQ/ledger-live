import { DeviceModelId as DMKDeviceModelId, type DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
    PairingRefusedError,
    rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { DeviceModelId } from "@ledgerhq/devices";
import { PeerRemovedPairing } from "@ledgerhq/errors";
import { KnownDevice } from "@ledgerhq/live-dmk-shared";
import {
    ConnectionErrorTypes,
    ConnectDeviceStateMachineEvent,
    ConnectDeviceStateMachineEventTypes,
    MatchedDevice,
} from "./types";
import {
    buildDisplayedDevices,
    createConnectionError,
    filterMatchedDevices,
    findMatchedDevice,
    getFirstMatchedDeviceFromDiscoveryEvent,
    getMatchedDevicesFromDiscoveryEvent,
    getSelectedMatchedDeviceFromDiscoveryEvent,
    isSameKnownDevice,
} from "./utils";

// Test helpers
const knownDeviceA = {
    transport: "RN_BLE",
    deviceModelId: DeviceModelId.nanoX,
    id: "known-device-a",
    name: "Ledger Nano X",
} as KnownDevice;

const knownDeviceB = {
    transport: "RN_BLE",
    deviceModelId: DeviceModelId.nanoSP,
    id: "known-device-b",
    name: "Ledger Nano S Plus",
} as KnownDevice;

const makeDiscoveredDevice = (knownDevice: KnownDevice): DiscoveredDevice =>
    ({
        id: `discovered-${knownDevice.id}`,
        name: knownDevice.name,
        deviceModel: { model: knownDevice.deviceModelId },
        transport: rnBleTransportIdentifier,
    }) as unknown as DiscoveredDevice;

const makeMatchedDevice = (knownDevice: KnownDevice): MatchedDevice => ({
    knownDevice,
    discoveredDevice: makeDiscoveredDevice(knownDevice),
});

const makeDiscoveredDeviceForFiltering = ({
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

// Tests
describe("Utils", () => {
    describe("filterMatchedDevices", () => {
        it("should match USB known devices by mapped DMK device model", () => {
            // Arrange
            const knownDevice = {
                ...knownDeviceA,
                deviceModelId: DeviceModelId.nanoSP,
                transport: "RN_HID",
            } as KnownDevice;
            const discoveredDevice = makeDiscoveredDeviceForFiltering({
                deviceModelId: DMKDeviceModelId.NANO_SP,
                model: DMKDeviceModelId.NANO_SP,
                transport: rnHidTransportIdentifier,
            });

            // Act
            const result = filterMatchedDevices([discoveredDevice], [knownDevice]);

            // Assert
            expect(result).toEqual([{ knownDevice, discoveredDevice }]);
        });

        it("should not match USB known devices when device model id differs", () => {
            // Arrange
            const knownDevice = {
                ...knownDeviceB,
                transport: "RN_HID",
            } as KnownDevice;
            const discoveredDevice = makeDiscoveredDeviceForFiltering({
                deviceModelId: DMKDeviceModelId.NANO_X,
                model: DMKDeviceModelId.NANO_X,
                transport: rnHidTransportIdentifier,
            });

            // Act
            const result = filterMatchedDevices([discoveredDevice], [knownDevice]);

            // Assert
            expect(result).toEqual([]);
        });

        it("should not match discovered devices when transport differs", () => {
            // Arrange
            const discoveredDevice = makeDiscoveredDeviceForFiltering({
                transport: rnHidTransportIdentifier,
            });

            // Act
            const result = filterMatchedDevices([discoveredDevice], [knownDeviceA]);

            // Assert
            expect(result).toEqual([]);
        });

        it("should match BLE known devices by stable id", () => {
            // Arrange
            const discoveredDevice = makeDiscoveredDeviceForFiltering({
                id: knownDeviceA.id,
                name: "Renamed Nano",
                transport: "RN_BLE",
            });

            // Act
            const result = filterMatchedDevices([discoveredDevice], [knownDeviceA]);

            // Assert
            expect(result).toEqual([{ knownDevice: knownDeviceA, discoveredDevice }]);
        });

        it("should match BLE known devices by old and new default names", () => {
            // Arrange
            const knownDevice = {
                ...knownDeviceA,
                id: "old-ble-address",
                name: "Ledger Nano X ABCD",
            } as KnownDevice;
            const discoveredDevice = makeDiscoveredDeviceForFiltering({
                id: "new-ble-address",
                name: "ABCD",
                transport: rnBleTransportIdentifier,
            });

            // Act
            const result = filterMatchedDevices([discoveredDevice], [knownDevice]);

            // Assert
            expect(result).toEqual([{ knownDevice, discoveredDevice }]);
        });

        it("should not match BLE devices when model differs", () => {
            // Arrange
            const knownDevice = {
                ...knownDeviceA,
                id: "old-ble-address",
                name: "Ledger Nano X ABCD",
            } as KnownDevice;
            const discoveredDevice = makeDiscoveredDeviceForFiltering({
                id: "new-ble-address",
                name: "ABCD",
                model: DMKDeviceModelId.NANO_SP,
                deviceModelId: DeviceModelId.nanoSP,
                transport: rnBleTransportIdentifier,
            });

            // Act
            const result = filterMatchedDevices([discoveredDevice], [knownDevice]);

            // Assert
            expect(result).toEqual([]);
        });

        it("should only return the discovered BLE device that matches the known device", () => {
            // Arrange
            const knownDevice = {
                ...knownDeviceA,
                id: "old-ble-address",
                name: "Ledger Nano X ABCD",
            } as KnownDevice;
            const unmatchedDiscoveredDevice = makeDiscoveredDeviceForFiltering({
                id: "other-ble-address",
                name: "EF12",
                transport: rnBleTransportIdentifier,
            });
            const matchedDiscoveredDevice = makeDiscoveredDeviceForFiltering({
                id: "new-ble-address",
                name: "ABCD",
                transport: rnBleTransportIdentifier,
            });

            // Act
            const result = filterMatchedDevices(
                [unmatchedDiscoveredDevice, matchedDiscoveredDevice],
                [knownDevice],
            );

            // Assert
            expect(result).toEqual([{ knownDevice, discoveredDevice: matchedDiscoveredDevice }]);
        });
    });

    describe("isSameKnownDevice", () => {
        it("should return true if known devices are the same", () => {
            // Arrange
            const knownDeviceA = {
                transport: "RN_BLE",
                deviceModelId: DeviceModelId.nanoX,
                id: "known-device-a",
                name: "Ledger Nano X",
            } as KnownDevice;

            const knownDeviceB = {
                transport: "RN_BLE",
                deviceModelId: DeviceModelId.nanoX,
                id: "known-device-a",
                name: "Ledger Nano X",
            } as KnownDevice;

            // Act
            const result = isSameKnownDevice(knownDeviceA, knownDeviceB);

            // Assert
            expect(result).toBe(true);
        });

        it("should return false if known devices are not the same", () => {
            // Arrange
            const knownDeviceA = {
                transport: "RN_BLE",
                deviceModelId: DeviceModelId.nanoX,
                id: "known-device-a",
                name: "Ledger Nano X",
            } as KnownDevice;

            const knownDeviceB = {
                transport: "RN_BLE",
                deviceModelId: DeviceModelId.nanoS,
                id: "known-device-b",
                name: "Ledger Nano S",
            } as KnownDevice;

            // Act
            const result = isSameKnownDevice(knownDeviceA, knownDeviceB);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe("findMatchedDevice", () => {
        it("should return matched device if it exists", () => {
            // Arrange
            const matchedDeviceA = makeMatchedDevice(knownDeviceA);
            const matchedDevices = [matchedDeviceA, makeMatchedDevice(knownDeviceB)];

            // Act
            const result = findMatchedDevice(knownDeviceA, matchedDevices);

            // Assert
            expect(result).toBe(matchedDeviceA);
        });

        it("should return null if matched device does not exist", () => {
            // Arrange
            const matchedDevices = [makeMatchedDevice(knownDeviceB)];

            // Act
            const result = findMatchedDevice(knownDeviceA, matchedDevices);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe("getFirstMatchedDeviceFromDiscoveryEvent", () => {
        it("should return matched device if it exists", () => {
            // Arrange
            const matchedDevice = makeMatchedDevice(knownDeviceA);
            const event: ConnectDeviceStateMachineEvent = {
                type: ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice,
                matchedDevices: [matchedDevice],
            };

            // Act
            const result = getFirstMatchedDeviceFromDiscoveryEvent(event);

            // Assert
            expect(result).toEqual(matchedDevice);
        });

        it("should return null if no matched device exists", () => {
            // Arrange
            const event: ConnectDeviceStateMachineEvent = {
                type: ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice,
            };

            // Act
            const result = getFirstMatchedDeviceFromDiscoveryEvent(event);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe("getMatchedDevicesFromDiscoveryEvent", () => {
        it("should return matched devices if one device is discovered", () => {
            // Arrange
            const matchedDevices = [makeMatchedDevice(knownDeviceA)];
            const event: ConnectDeviceStateMachineEvent = {
                type: ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice,
                matchedDevices,
            };

            // Act
            const result = getMatchedDevicesFromDiscoveryEvent(event);

            // Assert
            expect(result).toBe(matchedDevices);
        });

        it("should return matched devices if many devices are discovered", () => {
            // Arrange
            const matchedDevices = [makeMatchedDevice(knownDeviceA), makeMatchedDevice(knownDeviceB)];
            const event: ConnectDeviceStateMachineEvent = {
                type: ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices,
                matchedDevices,
            };

            // Act
            const result = getMatchedDevicesFromDiscoveryEvent(event);

            // Assert
            expect(result).toBe(matchedDevices);
        });

        it("should return empty array if no device is discovered", () => {
            // Arrange
            const event: ConnectDeviceStateMachineEvent = {
                type: ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice,
            };

            // Act
            const result = getMatchedDevicesFromDiscoveryEvent(event);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe("getSelectedMatchedDeviceFromDiscoveryEvent", () => {
        it("should return selected matched device if it exists", () => {
            // Arrange
            const selectedMatchedDevice = makeMatchedDevice(knownDeviceB);
            const event: ConnectDeviceStateMachineEvent = {
                type: ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices,
                matchedDevices: [makeMatchedDevice(knownDeviceA), selectedMatchedDevice],
            };

            // Act
            const result = getSelectedMatchedDeviceFromDiscoveryEvent(event, knownDeviceB);

            // Assert
            expect(result).toBe(selectedMatchedDevice);
        });

        it("should return null if selected matched device does not exist", () => {
            // Arrange
            const event: ConnectDeviceStateMachineEvent = {
                type: ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice,
            };

            // Act
            const result = getSelectedMatchedDeviceFromDiscoveryEvent(event, knownDeviceA);

            // Assert
            expect(result).toBeNull();
        });

        it("should return null if selected known device does not exist", () => {
            // Arrange
            const event: ConnectDeviceStateMachineEvent = {
                type: ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices,
                matchedDevices: [makeMatchedDevice(knownDeviceA)],
            };

            // Act
            const result = getSelectedMatchedDeviceFromDiscoveryEvent(event, null);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe("buildDisplayedDevices", () => {
        it("should return available displayed device if known device is matched", () => {
            // Arrange
            const send = jest.fn();
            const matchedDevice = makeMatchedDevice(knownDeviceA);

            // Act
            const result = buildDisplayedDevices([knownDeviceA], [matchedDevice], send);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                type: "available",
                knownDevice: knownDeviceA,
            });
        });

        it("should send available device event when available displayed device is selected", () => {
            // Arrange
            const send = jest.fn();
            const matchedDevice = makeMatchedDevice(knownDeviceA);
            const displayedDevices = buildDisplayedDevices([knownDeviceA], [matchedDevice], send);

            // Act
            displayedDevices[0]?.onSelect();

            // Assert
            expect(send).toHaveBeenCalledWith({
                type: ConnectDeviceStateMachineEventTypes.UserTapsAvailableDevice,
                matchedDevice,
            });
        });

        it("should return unavailable displayed device if known device is not matched", () => {
            // Arrange
            const send = jest.fn();

            // Act
            const result = buildDisplayedDevices([knownDeviceA], [], send);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                type: "not-available",
                knownDevice: knownDeviceA,
            });
        });

        it("should send unavailable device event when unavailable displayed device is selected", () => {
            // Arrange
            const send = jest.fn();
            const displayedDevices = buildDisplayedDevices([knownDeviceA], [], send);

            // Act
            displayedDevices[0]?.onSelect();

            // Assert
            expect(send).toHaveBeenCalledWith({
                type: ConnectDeviceStateMachineEventTypes.UserTapsUnavailableDevice,
                knownDevice: knownDeviceA,
            });
        });
    });

    describe("createConnectionError", () => {
        it("should return BLE pairing refused error if error is PairingRefusedError", () => {
            // Arrange
            const error = new PairingRefusedError();

            // Act
            const result = createConnectionError(error);

            // Assert
            expect(result).toEqual({
                type: ConnectionErrorTypes.BlePairingRefused,
            });
        });

        it("should return BLE peer removed pairing error if error is PeerRemovedPairing", () => {
            // Arrange
            const error = new PeerRemovedPairing();

            // Act
            const result = createConnectionError(error);

            // Assert
            expect(result).toEqual({
                type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
            });
        });

        it("should return unknown error if error is not handled", () => {
            // Arrange
            const error = new Error("unknown error");

            // Act
            const result = createConnectionError(error);

            // Assert
            expect(result).toEqual({
                type: ConnectionErrorTypes.Unknown,
                error,
            });
        });
    });
});
