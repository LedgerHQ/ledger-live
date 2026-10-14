import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import {
  listenToTransportDevices,
  type DeviceDiscoverySource,
  type DeviceDiscoverySourceEvent,
} from "@ledgerhq/live-dmk-shared";
import type { Observable } from "rxjs";
import type { MobileDiscoveryError } from "../../types";

type MobileDeviceDiscoverySource = DeviceDiscoverySource<MobileDiscoveryError>;
type MobileDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<MobileDiscoveryError>;

export class RnHidDeviceDiscoverySource implements MobileDeviceDiscoverySource {
  readonly transportId = rnHidTransportIdentifier;

  constructor(private readonly dmk: DeviceManagementKit) {}

  listen(): Observable<MobileDeviceDiscoverySourceEvent> {
    return listenToTransportDevices<MobileDiscoveryError>(this.dmk, this.transportId);
  }
}
