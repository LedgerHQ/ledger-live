import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import type { MockServerDevice } from "@features/platform-device-mock-server";
import type { ConnectKnownOrNewDeviceGetConnectivity } from "@ledgerhq/live-dmk-shared";

export type GetMockServerDevices = () => ReadonlyArray<MockServerDevice>;

// TODO: read the connectivity of a discovered mock device from the DMK once its mock server
// transport reports it, instead of the device list of the mock server.
export const buildGetConnectivity =
  (getMockServerDevices?: GetMockServerDevices): ConnectKnownOrNewDeviceGetConnectivity =>
  ({ transport, id }) => {
    if (transport === mockserverIdentifier) {
      const mockServerDevice = getMockServerDevices?.().find(device => device.id === id);
      return mockServerDevice?.connectivity_type === "USB" ? "USB" : "BLE";
    }
    return transport === rnBleTransportIdentifier ? "BLE" : "USB";
  };
