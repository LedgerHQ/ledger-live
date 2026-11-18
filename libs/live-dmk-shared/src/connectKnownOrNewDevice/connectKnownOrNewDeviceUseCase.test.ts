import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { BehaviorSubject, defer, Subject, type Observable } from "rxjs";

import { connectKnownOrNewDeviceUseCase } from "./connectKnownOrNewDeviceUseCase";
import { ConnectKnownOrNewDeviceUIStateTypes, type ConnectKnownOrNewDeviceUIState } from "./types";
import { createFakeDeviceDiscoveryService } from "../deviceConnectivity/discoveryService/__test-utils__/createFakeDeviceDiscoveryService";
import { BaseConnectionErrorTypes } from "../deviceConnectivity/types";

const setupTest = ({
  isPaused,
  connectedDevicesSource,
}: {
  isPaused?: boolean;
  connectedDevicesSource?: Observable<Array<ConnectedDevice>>;
} = {}) => {
  const connectedDevices$ = new BehaviorSubject<Array<ConnectedDevice>>([]);
  const discoveredDevices = new Subject<Array<DiscoveredDevice>>();
  const deviceDiscoveryService = createFakeDeviceDiscoveryService({
    discoveredDevices,
    onStop: () => discoveredDevices.next([]),
  });

  const useCase = connectKnownOrNewDeviceUseCase({
    dmk: {} as DeviceManagementKit,
    deviceDiscoveryService,
    knownDevices$: new BehaviorSubject([]),
    connectedDevices$: connectedDevicesSource ?? connectedDevices$,
    findMatchingDevice: () => null,
    getConnectivity: () => "BLE",
    removeKnownDevice: jest.fn(),
    mapConnectionError: error => ({ type: BaseConnectionErrorTypes.Unknown, error }),
    onConnected: jest.fn(),
    getDiscoveredDeviceKey: ({ id }) => id,
    ...(isPaused === undefined ? {} : { isPaused }),
  });

  const states: Array<ConnectKnownOrNewDeviceUIState> = [];
  const complete = jest.fn();
  const subscribe = () =>
    useCase.uiStates.subscribe({ next: state => states.push(state), complete });

  return { complete, connectedDevices$, deviceDiscoveryService, states, subscribe, useCase };
};

describe("connectKnownOrNewDeviceUseCase", () => {
  it("GIVEN a use case, WHEN subscribing, THEN it should start the state machine and emit Discovering", () => {
    // GIVEN
    const { deviceDiscoveryService, states, subscribe } = setupTest();

    // WHEN
    const subscription = subscribe();

    // THEN
    expect(states.at(-1)?.type).toBe(ConnectKnownOrNewDeviceUIStateTypes.Discovering);
    expect(deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });

  it("GIVEN a subscribed use case, WHEN unsubscribing, THEN it should stop discovery", () => {
    // GIVEN
    const { deviceDiscoveryService, subscribe } = setupTest();

    // WHEN
    subscribe().unsubscribe();

    // THEN
    expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a subscribed use case, WHEN the state machine fails, THEN it should emit UnknownError and complete", () => {
    // GIVEN
    const { complete, connectedDevices$, states, subscribe } = setupTest();
    const failure = new Error("session state failed");
    subscribe();

    // WHEN
    connectedDevices$.error(failure);

    // THEN
    expect(states.at(-1)).toEqual({
      type: ConnectKnownOrNewDeviceUIStateTypes.UnknownError,
      error: failure,
    });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a use case that emitted an UnknownError, WHEN subscribing again, THEN it should start a new state machine", () => {
    // GIVEN
    const failingConnectedDevices$ = new BehaviorSubject<Array<ConnectedDevice>>([]);
    const connectedDevicesBySubscription = [
      failingConnectedDevices$,
      new BehaviorSubject<Array<ConnectedDevice>>([]),
    ];
    const { deviceDiscoveryService, states, subscribe } = setupTest({
      connectedDevicesSource: defer(() => connectedDevicesBySubscription.shift()!),
    });
    subscribe();
    failingConnectedDevices$.error(new Error("session state failed"));

    // WHEN
    const subscription = subscribe();

    // THEN
    expect(states.at(-1)?.type).toBe(ConnectKnownOrNewDeviceUIStateTypes.Discovering);
    expect(deviceDiscoveryService.isRunning).toBe(true);
    subscription.unsubscribe();
  });

  it("GIVEN a subscribed use case, WHEN it is paused and then resumed, THEN it should stop discovery and start it again", () => {
    // GIVEN
    const { deviceDiscoveryService, subscribe, useCase } = setupTest();
    const subscription = subscribe();

    // WHEN
    useCase.pause();

    // THEN
    expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);

    // WHEN
    useCase.resume();

    // THEN
    expect(deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
  });

  it("GIVEN a paused use case, WHEN subscribing, THEN it should not start discovery", () => {
    // GIVEN
    const { deviceDiscoveryService, subscribe, useCase } = setupTest();
    useCase.pause();

    // WHEN
    const subscription = subscribe();

    // THEN
    expect(deviceDiscoveryService.start).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });

  it("GIVEN a use case that starts paused, WHEN subscribing, THEN it should not start discovery", () => {
    // GIVEN
    const { deviceDiscoveryService, subscribe } = setupTest({ isPaused: true });

    // WHEN
    const subscription = subscribe();

    // THEN
    expect(deviceDiscoveryService.start).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
