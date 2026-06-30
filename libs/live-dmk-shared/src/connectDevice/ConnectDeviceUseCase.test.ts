import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { EMPTY } from "rxjs";

import { connectDeviceUseCase, type ConnectDeviceUseCaseInput } from "./connectDeviceUseCase";
import {
  BaseConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type DeviceDiscoveryService,
  type KnownDevice,
} from "./types";

// Test helpers
const knownDevice: KnownDevice = {
  transport: "RN_BLE",
  deviceModelId: DeviceModelId.nanoX,
  id: "known-device-a",
  name: "Ledger Nano X",
};

type SetupTestOptions = {
  readonly knownDevices?: Array<KnownDevice>;
  readonly acceptedDeviceModelIds?: Array<DeviceModelId>;
};

const setupTest = ({
  acceptedDeviceModelIds,
  knownDevices = [knownDevice],
}: SetupTestOptions = {}) => {
  const deviceDiscoveryService: DeviceDiscoveryService = {
    start: jest.fn(),
    stop: jest.fn(),
    discoveredDevices: EMPTY,
    errors: EMPTY,
  };

  const dmk = {
    listConnectedDevices: jest.fn(() => []),
  } as unknown as DeviceManagementKit;

  const input = {} as ConnectDeviceUseCaseInput;
  input.knownDevices = knownDevices;
  input.acceptedDeviceModelIds = acceptedDeviceModelIds;
  input.dmk = dmk;
  input.deviceDiscoveryService = deviceDiscoveryService;
  input.matchDiscoveredDevices = jest.fn(() => []);
  input.mapConnectionError = jest.fn(error => ({ type: BaseConnectionErrorTypes.Unknown, error }));
  input.onConnected = jest.fn();

  return {
    deviceDiscoveryService,
    input,
  };
};

// Tests
describe("connectDeviceUseCase", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create and start the state machine only when subscribed", () => {
    // Arrange
    const { deviceDiscoveryService, input } = setupTest();
    const states: Array<ConnectDeviceUIState> = [];

    //Act
    const observable = connectDeviceUseCase(input);
    const subscription = observable.subscribe(state => states.push(state));

    //Assert
    expect(deviceDiscoveryService.start).toHaveBeenCalled();
    expect(states).toHaveLength(1);
    expect(states[0]).toEqual({
      type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
      device: knownDevice,
    });

    subscription.unsubscribe();
  });

  it("should forward UI states through the subscriber observer", () => {
    // Arrange
    const { input } = setupTest({ knownDevices: [] });
    const states: Array<ConnectDeviceUIState> = [];

    //Act
    const subscription = connectDeviceUseCase(input).subscribe(state => states.push(state));

    //Assert
    expect(states).toEqual([{ type: ConnectDeviceUIStateTypes.NoKnownDevice }]);

    subscription.unsubscribe();
  });

  it("should stop the state machine when unsubscribed", () => {
    // Arrange
    const { deviceDiscoveryService, input } = setupTest();

    //Act
    const subscription = connectDeviceUseCase(input).subscribe();

    subscription.unsubscribe();

    //Assert
    expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
  });

  it("should emit a terminal UnknownError UI state when an unexpected error escapes the inner state machine", () => {
    // Arrange
    const { input } = setupTest();
    const thrown = new Error("boom");
    (input.dmk.listConnectedDevices as jest.Mock).mockImplementationOnce(() => {
      throw thrown;
    });
    const states: Array<ConnectDeviceUIState> = [];
    const errorHandler = jest.fn();
    const completeHandler = jest.fn();

    //Act
    const subscription = connectDeviceUseCase(input).subscribe({
      next: state => states.push(state),
      error: errorHandler,
      complete: completeHandler,
    });

    //Assert
    expect(states).toEqual([
      { type: ConnectDeviceUIStateTypes.UnknownError, error: thrown },
    ]);
    expect(errorHandler).not.toHaveBeenCalled();
    expect(completeHandler).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
  });

  it("should filter known devices by accepted device models", () => {
    // Arrange
    const rejectedKnownDevice: KnownDevice = {
      transport: "RN_BLE",
      deviceModelId: DeviceModelId.nanoSP,
      id: "known-device-b",
      name: "Ledger Nano S Plus",
    };
    const { input } = setupTest({
      knownDevices: [knownDevice, rejectedKnownDevice],
      acceptedDeviceModelIds: [DeviceModelId.nanoX],
    });
    const states: Array<ConnectDeviceUIState> = [];

    // Act
    const subscription = connectDeviceUseCase(input).subscribe(state => states.push(state));

    // Assert
    expect(states[0]).toEqual({
      type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
      device: knownDevice,
    });

    subscription.unsubscribe();
  });
});
