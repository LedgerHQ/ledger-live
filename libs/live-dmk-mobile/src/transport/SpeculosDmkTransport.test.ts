import { BehaviorSubject, firstValueFrom, of } from "rxjs";
import { Right } from "purify-ts";
import {
  DeviceModelId,
  type Transport as DmkTransport,
  type TransportArgs,
  type TransportConnectedDevice,
  type TransportDiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import {
  speculosIdentifier,
  speculosTransportFactory,
} from "@ledgerhq/device-transport-kit-speculos";
import { SpeculosDmkTransport, type SpeculosTarget } from "./SpeculosDmkTransport";

jest.mock("@ledgerhq/device-transport-kit-speculos", () => ({
  speculosIdentifier: "SPECULOS_HTTP_TRANSPORT",
  speculosTransportFactory: jest.fn(),
}));

const discoveredDevice = {
  id: "SpeculosID",
  transport: "SPECULOS_HTTP_TRANSPORT",
} as unknown as TransportDiscoveredDevice;

const connectedDevice = { id: "SpeculosID" } as unknown as TransportConnectedDevice;

function createDelegate(): jest.Mocked<DmkTransport> {
  return {
    getIdentifier: jest.fn().mockReturnValue(speculosIdentifier),
    isSupported: jest.fn().mockReturnValue(true),
    listenToAvailableDevices: jest.fn().mockReturnValue(of([discoveredDevice])),
    startDiscovering: jest.fn().mockReturnValue(of(discoveredDevice)),
    stopDiscovering: jest.fn(),
    connect: jest.fn().mockResolvedValue(Right(connectedDevice)),
    disconnect: jest.fn().mockResolvedValue(Right(undefined)),
  } as unknown as jest.Mocked<DmkTransport>;
}

const args = {} as TransportArgs;

describe("SpeculosDmkTransport", () => {
  let delegate: jest.Mocked<DmkTransport>;

  beforeEach(() => {
    jest.clearAllMocks();
    delegate = createDelegate();
    (speculosTransportFactory as jest.Mock).mockReturnValue(() => delegate);
  });

  it("reports the transport kit identifier before any target is set", () => {
    const transport = new SpeculosDmkTransport(
      args,
      new BehaviorSubject<SpeculosTarget | null>(null),
    );

    expect(transport.getIdentifier()).toBe(speculosIdentifier);
    expect(speculosTransportFactory).not.toHaveBeenCalled();
  });

  it("discovers nothing while no target is set", async () => {
    const transport = new SpeculosDmkTransport(
      args,
      new BehaviorSubject<SpeculosTarget | null>(null),
    );

    await expect(firstValueFrom(transport.listenToAvailableDevices())).resolves.toEqual([]);
  });

  it("refuses to connect while no target is set", async () => {
    const transport = new SpeculosDmkTransport(
      args,
      new BehaviorSubject<SpeculosTarget | null>(null),
    );

    const result = await transport.connect({ deviceId: "SpeculosID", onDisconnect: jest.fn() });

    expect(result.isLeft()).toBe(true);
    expect(delegate.connect).not.toHaveBeenCalled();
  });

  it("builds the delegate with the target url and emulated model", async () => {
    const subject = new BehaviorSubject<SpeculosTarget | null>({
      url: "http://localhost:5000",
      deviceModelId: DeviceModelId.NANO_X,
    });
    const transport = new SpeculosDmkTransport(args, subject);

    await firstValueFrom(transport.listenToAvailableDevices());

    expect(speculosTransportFactory).toHaveBeenCalledWith(
      "http://localhost:5000",
      true,
      DeviceModelId.NANO_X,
    );
  });

  it("delegates discovery and connection once a target is set", async () => {
    const subject = new BehaviorSubject<SpeculosTarget | null>({ url: "http://localhost:5000" });
    const transport = new SpeculosDmkTransport(args, subject);

    await expect(firstValueFrom(transport.listenToAvailableDevices())).resolves.toEqual([
      discoveredDevice,
    ]);
    await expect(
      transport.connect({ deviceId: "SpeculosID", onDisconnect: jest.fn() }),
    ).resolves.toEqual(Right(connectedDevice));
  });

  it("rebuilds the delegate when the target changes", async () => {
    const subject = new BehaviorSubject<SpeculosTarget | null>({ url: "http://localhost:5000" });
    const transport = new SpeculosDmkTransport(args, subject);

    await firstValueFrom(transport.listenToAvailableDevices());
    subject.next({ url: "http://localhost:5001" });
    await firstValueFrom(transport.listenToAvailableDevices());

    expect(speculosTransportFactory).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000",
      true,
      undefined,
    );
    expect(speculosTransportFactory).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5001",
      true,
      undefined,
    );
  });

  it("reuses the delegate while the target is unchanged", async () => {
    const subject = new BehaviorSubject<SpeculosTarget | null>({ url: "http://localhost:5000" });
    const transport = new SpeculosDmkTransport(args, subject);

    await firstValueFrom(transport.listenToAvailableDevices());
    await firstValueFrom(transport.listenToAvailableDevices());

    expect(speculosTransportFactory).toHaveBeenCalledTimes(1);
  });
});
