import type { TransportArgs } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Right } from "purify-ts";
import {
  speculosIdentifier,
  speculosTransportFactory,
} from "@ledgerhq/device-transport-kit-speculos";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { firstValueFrom, of } from "rxjs";

import { SpeculosDmkTransport } from "./SpeculosDmkTransport";

const mockListenToAvailableDevices = jest.fn(() => of([{ id: "speculos-device" }]));
const mockStartDiscovering = jest.fn(() => of({ id: "speculos-device" }));
const mockStopDiscovering = jest.fn();
const mockConnect = jest.fn(async () => Right({ sessionId: "session-1" }));
const mockDisconnect = jest.fn(async () => Right(undefined));

jest.mock("@ledgerhq/device-transport-kit-speculos", () => {
  const actual = jest.requireActual("@ledgerhq/device-transport-kit-speculos");
  return {
    ...actual,
    speculosTransportFactory: jest.fn(() => () => ({
      listenToAvailableDevices: mockListenToAvailableDevices,
      startDiscovering: mockStartDiscovering,
      stopDiscovering: mockStopDiscovering,
      connect: mockConnect,
      disconnect: mockDisconnect,
      getIdentifier: () => actual.speculosIdentifier,
      isSupported: () => true,
    })),
  };
});

const savedEnv = {
  port: process.env.SPECULOS_API_PORT,
  address: process.env.SPECULOS_ADDRESS,
  device: process.env.SPECULOS_DEVICE,
};

const restoreEnv = (
  key: "SPECULOS_API_PORT" | "SPECULOS_ADDRESS" | "SPECULOS_DEVICE",
  value?: string,
) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
};

describe("SpeculosDmkTransport", () => {
  afterEach(() => {
    restoreEnv("SPECULOS_API_PORT", savedEnv.port);
    restoreEnv("SPECULOS_ADDRESS", savedEnv.address);
    restoreEnv("SPECULOS_DEVICE", savedEnv.device);
    jest.clearAllMocks();
  });

  it("lists no devices when the Speculos API port is unset", async () => {
    delete process.env.SPECULOS_API_PORT;
    const transport = new SpeculosDmkTransport({} as TransportArgs);

    await expect(firstValueFrom(transport.listenToAvailableDevices())).resolves.toEqual([]);
    expect(transport.getIdentifier()).toBe(speculosIdentifier);
    expect(speculosTransportFactory).not.toHaveBeenCalled();
  });

  it("connects through the Speculos delegate when the API port is set", async () => {
    process.env.SPECULOS_API_PORT = "40000";
    process.env.SPECULOS_ADDRESS = "http://127.0.0.1";
    process.env.SPECULOS_DEVICE = "nanoSP";
    const transport = new SpeculosDmkTransport({} as TransportArgs);
    const onDisconnect = jest.fn();
    const connectedDevice = { sessionId: "session-1" };

    await expect(firstValueFrom(transport.listenToAvailableDevices())).resolves.toEqual([
      { id: "speculos-device" },
    ]);
    expect(speculosTransportFactory).toHaveBeenCalledWith(
      "http://127.0.0.1:40000",
      true,
      ledgerToDmkDeviceIdMap[DeviceModelId.nanoSP],
    );

    await expect(transport.connect({ deviceId: "speculos-device", onDisconnect })).resolves.toEqual(
      Right({ sessionId: "session-1" }),
    );
    expect(mockConnect).toHaveBeenCalledWith({ deviceId: "speculos-device", onDisconnect });

    await transport.disconnect({ connectedDevice } as never);
    expect(mockDisconnect).toHaveBeenCalledWith({ connectedDevice });
  });

  it("keeps the Speculos device listed after the kit's listen completes", () => {
    process.env.SPECULOS_API_PORT = "40000";
    process.env.SPECULOS_ADDRESS = "http://127.0.0.1";
    const transport = new SpeculosDmkTransport({} as TransportArgs);
    const lists: unknown[] = [];
    let completed = false;

    const subscription = transport.listenToAvailableDevices().subscribe({
      next: devices => lists.push(devices),
      complete: () => {
        completed = true;
      },
    });

    expect(lists).toEqual([[{ id: "speculos-device" }]]);
    expect(completed).toBe(false);
    subscription.unsubscribe();
  });

  it("keeps the configured port when the address already carries one", async () => {
    process.env.SPECULOS_API_PORT = "40000";
    process.env.SPECULOS_ADDRESS = "http://127.0.0.1:50000/";
    const transport = new SpeculosDmkTransport({} as TransportArgs);

    await firstValueFrom(transport.listenToAvailableDevices());

    expect(speculosTransportFactory).toHaveBeenCalledWith(
      "http://127.0.0.1:50000",
      true,
      expect.anything(),
    );
  });

  it("discovers a Nano S Plus when SPECULOS_DEVICE is unset", async () => {
    process.env.SPECULOS_API_PORT = "40000";
    process.env.SPECULOS_ADDRESS = "http://127.0.0.1";
    delete process.env.SPECULOS_DEVICE;
    const transport = new SpeculosDmkTransport({} as TransportArgs);

    await firstValueFrom(transport.listenToAvailableDevices());

    expect(speculosTransportFactory).toHaveBeenCalledWith(
      "http://127.0.0.1:40000",
      true,
      ledgerToDmkDeviceIdMap[DeviceModelId.nanoSP],
    );
  });

});
