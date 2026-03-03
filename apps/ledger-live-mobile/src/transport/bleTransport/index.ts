import Config from "react-native-config";
import { DeviceManagementKitBLETransport } from "@ledgerhq/live-dmk-mobile";
import makeMock from "./makeMock";
import createAPDUMock from "~/logic/createAPDUMock";

const names: { [key: string]: string } = {};

/**
 * Retrieves the appropriate BLE transport instance based on environment configuration
 */
const getBLETransport = () => {
  if (Config.MOCK || Config.DETOX) {
    return makeMock({
      // TODO E2E: This could be dynamically set in bridge/server.js
      createTransportDeviceMock: (id: string, name: string, serviceUUID: string) => {
        names[id] = name;
        const serviceUUIDs = [serviceUUID];
        const apduMock = createAPDUMock({
          setDeviceName: (name: string) => {
            names[id] = name;
            return Promise.resolve();
          },
          getDeviceName: () => Promise.resolve(names[id] || id),
          getAddress: () =>
            Promise.resolve({
              publicKey: "00000000000000000000",
              address: "11111111111111111111111111111",
              chainCode: "0000000000000000000000000000000000000000000000000000000000000000",
            }),
          getAppAndVersion: () =>
            Promise.resolve({
              name: "BOLOS",
              version: "0.0.0",
              flags: 0,
            }),
        });
        return {
          id,
          name: names[id] || id,
          apduMock,
          serviceUUIDs,
        };
      },
    });
  } else {
    return DeviceManagementKitBLETransport;
  }
};

export default getBLETransport;
