import {
  TransportConnectedDevice,
  UnknownDeviceError,
  type DisconnectHandler,
  type Transport,
  type TransportArgs,
  type TransportDiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { Left, Right } from "purify-ts";
import { BehaviorSubject, Subject } from "rxjs";

/** In-memory transport that, like web-ble, keeps listing every device it ever discovered. */
export const createFakeTransport = () => {
  const discovered$ = new Subject<TransportDiscoveredDevice>();
  const registry$ = new BehaviorSubject<TransportDiscoveredDevice[]>([]);
  const disconnectHandlers = new Map<string, DisconnectHandler>();

  const transport: Transport = {
    getIdentifier: () => "FAKE",
    isSupported: () => true,
    startDiscovering: () => discovered$.asObservable(),
    stopDiscovering: jest.fn(),
    listenToAvailableDevices: () => registry$.asObservable(),
    connect: jest.fn(async ({ deviceId, onDisconnect }) => {
      const device = registry$.getValue().find(({ id }) => id === deviceId);
      if (!device) return Left(new UnknownDeviceError(deviceId));
      disconnectHandlers.set(deviceId, onDisconnect);
      return Right(
        new TransportConnectedDevice({
          id: deviceId,
          deviceModel: device.deviceModel,
          type: "BLE",
          transport: "FAKE",
          name: device.name,
          sendApdu: jest.fn(async () =>
            Right({ data: new Uint8Array(), statusCode: new Uint8Array([0x90, 0x00]) }),
          ),
        }),
      );
    }),
    disconnect: jest.fn(async () => Right(undefined)),
  };

  return {
    transport,
    factory: () => transport,
    args: {} as TransportArgs,
    discover: (device: TransportDiscoveredDevice) => {
      registry$.next([...registry$.getValue(), device]);
      discovered$.next(device);
    },
    loseConnection: (deviceId: string) => disconnectHandlers.get(deviceId)?.(deviceId),
  };
};

export const makeTransportDevice = (id: string): TransportDiscoveredDevice =>
  ({
    id,
    name: id,
    deviceModel: { id: "flex", productName: "Ledger Flex" },
    transport: "FAKE",
  }) as TransportDiscoveredDevice;
