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

    const connectedDevice = input.dmk.listConnectedDevices()[0];
    const sessionId = connectedDevice ? connectedDevice.sessionId : null;

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
