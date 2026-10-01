import type { DeviceManagementKit, TransportIdentifier } from "@ledgerhq/device-management-kit";
import {
  connectNewDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type DeviceConnectionResult,
  type DeviceDiscoverySource,
} from "@ledgerhq/live-dmk-shared";
import { Platform } from "react-native";
import type { Observable } from "rxjs";

import type { MobileConnectionError, MobileDiscoveryError } from "../deviceConnectivity/types";
import type { MobileConnectNewDeviceUIState } from "./types";
import { RnBleDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnHidDeviceDiscoverySource";
import { SpeculosDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/SpeculosDeviceDiscoverySource";
import { buildMobileCompatDeviceId, createConnectionError } from "../connectDevice/utils";

export type ConnectNewDeviceInput = {
  dmk: DeviceManagementKit;
  onConnected: (result: DeviceConnectionResult) => void;
  onClose: () => void;
  deviceNotFoundDelay?: number;
  successDelay?: number;
};

const buildDiscoverySources = (
  dmk: DeviceManagementKit,
  platformOS: typeof Platform.OS,
): Map<TransportIdentifier, DeviceDiscoverySource<MobileDiscoveryError>> => {
  const sources: Array<DeviceDiscoverySource<MobileDiscoveryError>> = [
    new RnBleDeviceDiscoverySource(dmk),
    ...(platformOS === "android" ? [new RnHidDeviceDiscoverySource(dmk)] : []),
    new SpeculosDeviceDiscoverySource(dmk),
  ];

  return new Map(sources.map(source => [source.transportId, source]));
};

export function connectNewDevice(
  input: ConnectNewDeviceInput,
): Observable<MobileConnectNewDeviceUIState> {
  return connectNewDeviceUseCase<MobileDiscoveryError, MobileConnectionError>({
    ...input,
    deviceDiscoveryService: new DefaultDeviceDiscoveryService<MobileDiscoveryError>(
      buildDiscoverySources(input.dmk, Platform.OS),
    ),
    mapConnectionError: createConnectionError,
    buildCompatDeviceId: buildMobileCompatDeviceId,
  });
}
