import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/devices";
import { EMPTY } from "rxjs";

import { connectDeviceUseCase, type ConnectDeviceUseCaseInput } from "./connectDeviceUseCase";
import { DefaultDeviceDiscoveryService } from "./discoveryService/DefaultDeviceDiscoveryService";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type DeviceDiscoveryService,
} from "./types";
import { KnownDevice } from "@ledgerhq/live-dmk-shared";

// Test helpers
const knownDevice: KnownDevice = {
  transport: "RN_BLE",
  deviceModelId: DeviceModelId.nanoX,
  id: "known-device-a",
  name: "Ledger Nano X",
};

jest.mock("./discoveryService/DefaultDeviceDiscoveryService", () => ({
  DefaultDeviceDiscoveryService: jest.fn(),
}));

const DefaultDeviceDiscoveryServiceMock = jest.mocked(DefaultDeviceDiscoveryService);

type SetupTestOptions = {
  readonly knownDevices?: Array<KnownDevice>;
};

const setupTest = ({ knownDevices = [knownDevice] }: SetupTestOptions = {}) => {
  const deviceDiscoveryService: DeviceDiscoveryService = {
    start: jest.fn(),
    stop: jest.fn(),
    discoveredDevices: EMPTY,
    errors: EMPTY,
  };
  DefaultDeviceDiscoveryServiceMock.mockImplementation(
    () => deviceDiscoveryService as DefaultDeviceDiscoveryService,
  );

  const dmk = {
    listConnectedDevices: jest.fn(() => []),
  } as unknown as DeviceManagementKit;

  const input = {} as ConnectDeviceUseCaseInput;
  input.knownDevices = knownDevices;
  input.dmk = dmk;
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
});
