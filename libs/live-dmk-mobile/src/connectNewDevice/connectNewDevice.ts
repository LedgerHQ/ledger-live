import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  connectNewDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type DeviceConnectionResult,
} from "@ledgerhq/live-dmk-shared";
import { Platform } from "react-native";
import type { Observable } from "rxjs";

import type { MobileConnectionError, MobileDiscoveryError } from "../deviceConnectivity/types";
import type { MobileConnectNewDeviceUIState } from "./types";
import { buildMobileCompatDeviceId, createConnectionError } from "../connectDevice/utils";
import { buildDiscoverySources } from "./buildDiscoverySources";
import { filterListedDevices } from "./filterListedDevices";
import { getDiscoveredDeviceKey } from "./getDiscoveredDeviceKey";

export type ConnectNewDeviceInput = {
  dmk: DeviceManagementKit;
  onConnected: (result: DeviceConnectionResult) => void;
  onClose: () => void;
  isMockServerEnabled: boolean;
  deviceNotFoundDelay?: number;
  successDelay?: number;
};

export function connectNewDevice(
  input: ConnectNewDeviceInput,
): Observable<MobileConnectNewDeviceUIState> {
  return connectNewDeviceUseCase<MobileDiscoveryError, MobileConnectionError>({
    ...input,
    deviceDiscoveryService: new DefaultDeviceDiscoveryService<MobileDiscoveryError>(
      buildDiscoverySources(input.dmk, Platform.OS, input.isMockServerEnabled),
    ),
    mapConnectionError: createConnectionError,
    getDiscoveredDeviceKey,
    filterListedDevices,
    buildCompatDeviceId: buildMobileCompatDeviceId,
  });
}
