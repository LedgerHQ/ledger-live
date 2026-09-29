import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { DeviceDiscoverySource, DeviceDiscoverySourceEvent } from "@ledgerhq/live-dmk-shared";
import type { Observable } from "rxjs";
import type { MobileDiscoveryError } from "../../types";
import { listenToTransportDevices } from "./listenToTransportDevices";

type MobileDeviceDiscoverySource = DeviceDiscoverySource<MobileDiscoveryError>;
type MobileDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<MobileDiscoveryError>;

export class RnHidDeviceDiscoverySource implements MobileDeviceDiscoverySource {
  readonly transportId = rnHidTransportIdentifier;

  constructor(private readonly dmk: DeviceManagementKit) {}

  listen(): Observable<MobileDeviceDiscoverySourceEvent> {
    return listenToTransportDevices(this.dmk, this.transportId);
  }
}
