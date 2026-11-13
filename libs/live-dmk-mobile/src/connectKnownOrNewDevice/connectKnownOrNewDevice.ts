import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  connectedDevices$,
  connectKnownOrNewDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type ConnectKnownOrNewDeviceDelays,
  type ConnectKnownOrNewDeviceKnownDevice,
  type ConnectKnownOrNewDeviceOnConnected,
} from "@ledgerhq/live-dmk-shared";
import { Platform } from "react-native";
import type { Observable } from "rxjs";

import type { MobileConnectionError, MobileDiscoveryError } from "../deviceConnectivity/types";
import type { MobileConnectKnownOrNewDevice } from "./types";
import { buildMobileCompatDeviceId, createConnectionError } from "../connectDevice/utils";
import { buildDiscoverySources } from "../connectNewDevice/buildDiscoverySources";
import { filterListedDevices } from "../connectNewDevice/filterListedDevices";
import { getDiscoveredDeviceKey } from "../connectNewDevice/getDiscoveredDeviceKey";
import { findMatchingDevice } from "../utils/findMatchingDevice";
import { buildGetConnectivity, type GetMockServerDevices } from "./getConnectivity";

export type ConnectKnownOrNewDeviceInput = {
  dmk: DeviceManagementKit;
  knownDevices$: Observable<Array<ConnectKnownOrNewDeviceKnownDevice>>;
  removeKnownDevice: (knownDevice: ConnectKnownOrNewDeviceKnownDevice) => void;
  onConnected: ConnectKnownOrNewDeviceOnConnected;
  isMockServerEnabled: boolean;
  /** The devices of the mock server, which give the connectivity of the discovered mock devices. */
  getMockServerDevices?: GetMockServerDevices;
  isPaused?: boolean;
  delays?: ConnectKnownOrNewDeviceDelays;
};

/**
 * One discovery service lists the devices and is shared with the embedded connectNewDevice flow of
 * the Add mode, so that the scan does not stop when the Add mode opens or closes.
 */
export function connectKnownOrNewDevice({
  dmk,
  isMockServerEnabled,
  getMockServerDevices,
  ...input
}: ConnectKnownOrNewDeviceInput): MobileConnectKnownOrNewDevice {
  return connectKnownOrNewDeviceUseCase<MobileDiscoveryError, MobileConnectionError>({
    ...input,
    dmk,
    deviceDiscoveryService: new DefaultDeviceDiscoveryService<MobileDiscoveryError>(
      buildDiscoverySources(dmk, Platform.OS, isMockServerEnabled),
    ),
    connectedDevices$: connectedDevices$(dmk),
    findMatchingDevice,
    getConnectivity: buildGetConnectivity(getMockServerDevices),
    mapConnectionError: createConnectionError,
    getDiscoveredDeviceKey,
    filterListedDevices,
    buildCompatDeviceId: buildMobileCompatDeviceId,
  });
}
