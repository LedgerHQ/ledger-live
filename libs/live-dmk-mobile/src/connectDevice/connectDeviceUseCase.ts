import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { Observable } from "rxjs";

import { DefaultConnectDeviceStateMachine } from "./ConnectDeviceStateMachine";
import type {
  ConnectDeviceUIState,
  DeviceConnectionResult,
} from "./types";
import { DefaultDeviceDiscoveryService } from "./discoveryService/DefaultDeviceDiscoveryService";
import { KnownDevice } from "@ledgerhq/live-dmk-shared";

export type ConnectDeviceUseCaseInput = {
  knownDevices: Array<KnownDevice>;
  dmk: DeviceManagementKit;
  onConnected: (result: DeviceConnectionResult) => void;
};

export function connectDeviceUseCase(
  input: ConnectDeviceUseCaseInput,
): Observable<ConnectDeviceUIState> {
  return new Observable(observer => {

    const connectedDevices = input.dmk.listConnectedDevices();
    const sessionId = connectedDevices.length === 1 ? connectedDevices[0].sessionId : null;

    const stateMachine = new DefaultConnectDeviceStateMachine({
      ...input,
      sessionId,
      deviceDiscoveryService: new DefaultDeviceDiscoveryService(input.dmk),
      observer,
    });

    stateMachine.start();

    return () => {
      stateMachine.stop();
    };
  });
}
