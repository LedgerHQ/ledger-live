import {
  DeviceModelId as DMKDeviceModelId,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";

import { DefaultConnectNewDeviceStateMachine } from "./ConnectNewDeviceStateMachine";
import {
  connectNewDeviceUseCase,
  type ConnectNewDeviceUseCaseInput,
} from "./connectNewDeviceUseCase";
import {
  ConnectNewDeviceUIStateTypes,
  type ConnectNewDeviceUIState,
  type ConnectNewDeviceUIStateType,
} from "./types";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  type DeviceDiscoveryService,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";

// Test helpers
const bleTransport = "RN_BLE" as TransportIdentifier;

const nanoX: DiscoveredDevice = {
  id: "nano-x-id",
  name: "Nano X 1A2B",
  deviceModel: { id: "nanoX", model: DMKDeviceModelId.NANO_X, name: "Ledger Nano X" },
  transport: bleTransport,
} as DiscoveredDevice;

const connectedDevice = {
  id: "connected-device-id",
  sessionId: "session-id",
  modelId: DMKDeviceModelId.NANO_X,
  name: "Nano X 1A2B",
  type: "BLE",
  transport: bleTransport,
} as ConnectedDevice;

const SUCCESS_DELAY = 1_000;

const setupTest = () => {
  const discoveredDevices = new Subject<Array<DiscoveredDevice>>();
  const errors = new Subject<UnknownDiscoveryError>();
  const deviceDiscoveryService: DeviceDiscoveryService = {
    start: jest.fn(),
    stop: jest.fn(),
    transportIds: [bleTransport],
    discoveredDevices,
    errors,
  };

  const input: ConnectNewDeviceUseCaseInput = {
    dmk: {
      connect: jest.fn().mockResolvedValue("session-id"),
      getConnectedDevice: jest.fn(() => connectedDevice),
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as unknown as DeviceManagementKit,
    deviceDiscoveryService,
    mapConnectionError: jest.fn(error => ({ type: BaseConnectionErrorTypes.Unknown, error })),
    onConnected: jest.fn(),
    onClose: jest.fn(),
    successDelay: SUCCESS_DELAY,
  };

  const states: Array<ConnectNewDeviceUIState> = [];
  const lastState = <TType extends ConnectNewDeviceUIStateType>(type: TType) => {
    const state = states[states.length - 1];
    expect(state?.type).toBe(type);
    return state as Extract<ConnectNewDeviceUIState, { type: TType }>;
  };

  return {
    deviceDiscoveryService,
    discoverDevices: (devices: Array<DiscoveredDevice>) => discoveredDevices.next(devices),
    emitDiscoveryError: (error: UnknownDiscoveryError) => errors.next(error),
    input,
    lastState,
    states,
  };
};

// Tests
describe("connectNewDeviceUseCase", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should start the state machine only when subscribed", () => {
    // Arrange
    const { deviceDiscoveryService, input, states } = setupTest();

    // Act
    const observable = connectNewDeviceUseCase(input);

    // Assert
    expect(deviceDiscoveryService.start).not.toHaveBeenCalled();

    // Act
    const subscription = observable.subscribe(state => states.push(state));

    // Assert
    expect(deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    expect(states).toEqual([
      {
        type: ConnectNewDeviceUIStateTypes.Discovering,
        devices: [],
        scanningTransports: [bleTransport],
        showDeviceNotFound: false,
      },
    ]);

    subscription.unsubscribe();
  });

  it("should emit every UI state up to Done and call onConnected when a device connects", async () => {
    // Arrange
    const { discoverDevices, input, lastState, states } = setupTest();
    const subscription = connectNewDeviceUseCase(input).subscribe(state => states.push(state));

    // Act
    discoverDevices([nanoX]);
    lastState(ConnectNewDeviceUIStateTypes.Discovering).devices[0].onSelect();
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(SUCCESS_DELAY);

    // Assert
    expect(states.map(state => state.type)).toEqual([
      ConnectNewDeviceUIStateTypes.Discovering,
      ConnectNewDeviceUIStateTypes.Discovering,
      ConnectNewDeviceUIStateTypes.Connecting,
      ConnectNewDeviceUIStateTypes.Connected,
      ConnectNewDeviceUIStateTypes.Done,
    ]);
    expect(input.onConnected).toHaveBeenCalledTimes(1);
    expect(input.onConnected).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "session-id", connectedDevice }),
    );

    subscription.unsubscribe();
  });

  it("should emit Terminated and call onClose when a discovery error is closed", () => {
    // Arrange
    const { emitDiscoveryError, input, lastState, states } = setupTest();
    const subscription = connectNewDeviceUseCase(input).subscribe(state => states.push(state));

    // Act
    emitDiscoveryError({ type: BaseDiscoveryErrorTypes.Unknown, transportId: bleTransport });
    lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).close();

    // Assert
    expect(states.map(state => state.type)).toEqual([
      ConnectNewDeviceUIStateTypes.Discovering,
      ConnectNewDeviceUIStateTypes.DiscoveryError,
      ConnectNewDeviceUIStateTypes.Terminated,
    ]);
    expect(input.onClose).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
  });

  it("should stop the state machine when unsubscribed", () => {
    // Arrange
    const { deviceDiscoveryService, input } = setupTest();
    const subscription = connectNewDeviceUseCase(input).subscribe();

    // Act
    subscription.unsubscribe();

    // Assert
    expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    expect(input.onClose).not.toHaveBeenCalled();
  });

  it("should emit a terminal UnknownError UI state when an unexpected error escapes the inner state machine", () => {
    // Arrange
    const { input, states } = setupTest();
    const thrown = new Error("boom");
    jest
      .spyOn(DefaultConnectNewDeviceStateMachine.prototype, "start")
      .mockImplementationOnce(() => {
        throw thrown;
      });
    const errorHandler = jest.fn();
    const completeHandler = jest.fn();

    // Act
    const subscription = connectNewDeviceUseCase(input).subscribe({
      next: state => states.push(state),
      error: errorHandler,
      complete: completeHandler,
    });

    // Assert
    expect(states).toEqual([{ type: ConnectNewDeviceUIStateTypes.UnknownError, error: thrown }]);
    expect(errorHandler).not.toHaveBeenCalled();
    expect(completeHandler).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
  });
});
