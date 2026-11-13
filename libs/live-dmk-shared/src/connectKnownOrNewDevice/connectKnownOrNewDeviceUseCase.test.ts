import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { BehaviorSubject, Subject } from "rxjs";

import { connectKnownOrNewDeviceUseCase } from "./connectKnownOrNewDeviceUseCase";
import { ConnectKnownOrNewDeviceUIStateTypes, type ConnectKnownOrNewDeviceUIState } from "./types";
import { createFakeDeviceDiscoveryService } from "../deviceConnectivity/discoveryService/__test-utils__/createFakeDeviceDiscoveryService";
import { BaseConnectionErrorTypes } from "../deviceConnectivity/types";

const setupTest = ({ isPaused }: { isPaused?: boolean } = {}) => {
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
    connectedDevices$,
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
  it("should start the state machine and emit Discovering when it is subscribed", () => {
    const { deviceDiscoveryService, states, subscribe } = setupTest();

    const subscription = subscribe();

    expect(states.at(-1)?.type).toBe(ConnectKnownOrNewDeviceUIStateTypes.Discovering);
    expect(deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });

  it("should stop discovery when it is unsubscribed", () => {
    const { deviceDiscoveryService, subscribe } = setupTest();

    subscribe().unsubscribe();

    expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
  });

  it("should emit UnknownError and complete when the state machine fails", () => {
    const { complete, connectedDevices$, states, subscribe } = setupTest();
    const failure = new Error("session state failed");

    subscribe();
    connectedDevices$.error(failure);

    expect(states.at(-1)).toEqual({
      type: ConnectKnownOrNewDeviceUIStateTypes.UnknownError,
      error: failure,
    });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("should start a new state machine when it is subscribed again after an UnknownError", () => {
    const { connectedDevices$, deviceDiscoveryService, states, subscribe } = setupTest();

    subscribe();
    connectedDevices$.error(new Error("session state failed"));
    const subscription = subscribe();

    expect(deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    expect(states.at(-1)?.type).toBe(ConnectKnownOrNewDeviceUIStateTypes.UnknownError);
    subscription.unsubscribe();
  });

  it("should stop discovery when it is paused and start it again when it resumes", () => {
    const { deviceDiscoveryService, subscribe, useCase } = setupTest();

    const subscription = subscribe();
    useCase.pause();
    expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    useCase.resume();

    expect(deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
  });

  it("should not start discovery when it is subscribed after a pause", () => {
    const { deviceDiscoveryService, subscribe, useCase } = setupTest();

    useCase.pause();
    const subscription = subscribe();

    expect(deviceDiscoveryService.start).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });

  it("should not start discovery when it starts paused", () => {
    const { deviceDiscoveryService, subscribe } = setupTest({ isPaused: true });

    const subscription = subscribe();

    expect(deviceDiscoveryService.start).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
