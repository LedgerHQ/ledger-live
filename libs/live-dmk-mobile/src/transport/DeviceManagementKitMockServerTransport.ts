import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { firstValueFrom } from "rxjs";
import { first, map, tap, timeout } from "rxjs/operators";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";
import { getMockServerDeviceIdFromCompatId } from "../mockServer/mockServerCompatDeviceId";

export class DeviceManagementKitMockServerTransport {
  static async open(
    compatDeviceId: string,
    timeoutMs?: number,
    dmk: DeviceManagementKit = getDeviceManagementKit(),
  ): Promise<DmkCompatTransport> {
    const deviceId = getMockServerDeviceIdFromCompatId(compatDeviceId);

    const connectedDevice = dmk
      .listConnectedDevices()
      .find(device => device.transport === mockserverIdentifier && device.id === deviceId);
    if (connectedDevice) {
      return new DmkCompatTransport(dmk, connectedDevice.sessionId);
    }

    const discoveredDevice = await firstValueFrom(
      dmk.listenToAvailableDevices({ transport: mockserverIdentifier }).pipe(
        map(devices => devices.find(device => device.id === deviceId)),
        first(device => device !== undefined),
        timeoutMs ? timeout(timeoutMs) : tap(),
      ),
    );
    const sessionId = await dmk.connect({
      device: discoveredDevice,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    return new DmkCompatTransport(dmk, sessionId);
  }
}
