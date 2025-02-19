import Config from "react-native-config";
import BleTransport from "@ledgerhq/react-native-hw-transport-ble";
import { DeviceManagementKitTransport } from "@ledgerhq/live-dmk-mobile";
import makeMock from "./makeMock";
import createAPDUMock from "../logic/createAPDUMock";
import { Observer } from "rxjs";
import { SchedulerLike } from "rxjs";
import { TraceContext } from "@ledgerhq/logs";
import { Device } from "react-native-ble-plx";
import type {
  DescriptorEvent,
  Observer as TransportObserver,
  Subscription as TransportSubscription,
} from "@ledgerhq/hw-transport";
import { HwTransportError } from "@ledgerhq/errors";
import { DeviceId, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { TransportBleDevice } from "@ledgerhq/live-common/ble/types";

interface CommonTransportConstructor {
  listen: (
    observer: TransportObserver<DescriptorEvent<TransportBleDevice | null>, HwTransportError>,
    context?: TraceContext,
  ) => TransportSubscription;
  observeState: (
    observer: Observer<{
      type: string;
      available: boolean;
    }>,
  ) => TransportSubscription;
  disconnectDevice: (deviceId: DeviceId, context?: TraceContext) => Promise<void>;
  setLogLevel: (level: string) => void;
  open: (
    deviceOrId: (Device & DiscoveredDevice) | string,
    timeoutMs?: number,
    context?: TraceContext,
    options?: { rxjsScheduler?: SchedulerLike },
  ) => Promise<BleTransport | DeviceManagementKitTransport>;
}

const names: { [key: string]: string } = {};

/**
 * Retrieves the appropriate BLE transport instance based on environment configuration and feature flags.
 *
 * - If `Config.MOCK` is `true`, it returns a mock transport for testing.
 * - If `isLDMKEnabled` is `true`, it returns `DeviceManagementKitTransport`.
 * - Otherwise, it defaults to `BleTransport`.
 *
 * @param {Object} options - Configuration options.
 * @param {boolean} options.isLDMKEnabled - Flag to enable Device Management Kit transport.
 * @returns {typeof BleTransport} The selected transport instance.
 */
const getBLETransport = ({
  isLDMKEnabled,
}: {
  isLDMKEnabled: boolean;
}): CommonTransportConstructor => {
  if (Config.MOCK) {
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
    }) as unknown as CommonTransportConstructor;
  } else {
    // when not in MOCK mode, return DeviceManagementKitTransport if enabled,
    // otherwise BleTransport
    return isLDMKEnabled ? DeviceManagementKitTransport : BleTransport;
  }
};

export default getBLETransport;
