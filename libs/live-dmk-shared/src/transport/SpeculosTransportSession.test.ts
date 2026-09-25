import {
  UnknownDeviceError,
  type Transport as DmkTransport,
} from "@ledgerhq/device-management-kit";
import { Left, Right } from "purify-ts";

import { SpeculosTransportSession } from "./SpeculosTransportSession";

const DEVICE_ID = "speculos-device";

const createTransport = () =>
  ({
    stopDiscovering: jest.fn(),
    connect: jest.fn(async () => Right({ id: DEVICE_ID })),
    disconnect: jest.fn(async () => Right(undefined)),
  }) as unknown as DmkTransport;

const openedTransports = (openTransport: jest.Mock): DmkTransport[] =>
  openTransport.mock.results.map(result => result.value);

const target = { url: "http://127.0.0.1:40000" };
const otherTarget = { url: "http://127.0.0.1:40001" };
const connectParams = { deviceId: DEVICE_ID, onDisconnect: jest.fn() };
const connectedDevice = { id: DEVICE_ID } as never;

describe("SpeculosTransportSession", () => {
  it("resolves no transport until a target is known", () => {
    const openTransport = jest.fn(createTransport);
    const session = new SpeculosTransportSession(openTransport);

    expect(session.resolve(null)).toBeNull();
    expect(openTransport).not.toHaveBeenCalled();
  });

  it("opens a single transport per target", () => {
    const openTransport = jest.fn(createTransport);
    const session = new SpeculosTransportSession(openTransport);

    const transport = session.resolve(target);

    expect(transport).toBe(session.resolve({ ...target }));
    expect(openTransport).toHaveBeenCalledTimes(1);
    expect(openTransport).toHaveBeenCalledWith(target);
  });

  it("stops the discovery of the previous transport when the target changes", () => {
    const openTransport = jest.fn(createTransport);
    const session = new SpeculosTransportSession(openTransport);

    const transport = session.resolve(target);

    expect(session.resolve(otherTarget)).not.toBe(transport);
    expect(transport!.stopDiscovering).toHaveBeenCalledTimes(1);
  });

  it("stops discovering on the open transport only", () => {
    const transport = createTransport();
    const session = new SpeculosTransportSession(() => transport);

    session.stopDiscovering();
    expect(transport.stopDiscovering).not.toHaveBeenCalled();

    session.resolve(target);
    session.stopDiscovering();
    expect(transport.stopDiscovering).toHaveBeenCalledTimes(1);
  });

  it("connects through the transport opened for the target", async () => {
    const transport = createTransport();
    const session = new SpeculosTransportSession(() => transport);

    await expect(session.connect(target, connectParams)).resolves.toEqual(Right({ id: DEVICE_ID }));
    expect(transport.connect).toHaveBeenCalledWith(connectParams);
  });

  it("fails to connect when no target is set", async () => {
    const openTransport = jest.fn(createTransport);
    const session = new SpeculosTransportSession(openTransport);

    await expect(session.connect(null, connectParams)).resolves.toEqual(
      Left(new UnknownDeviceError("Speculos target not set")),
    );
    expect(openTransport).not.toHaveBeenCalled();
  });

  it("disconnects a device through the transport that connected it, even after the target changed", async () => {
    const openTransport = jest.fn(createTransport);
    const session = new SpeculosTransportSession(openTransport);

    await session.connect(target, connectParams);
    session.resolve(otherTarget);
    await session.disconnect({ connectedDevice });

    const [connectingTransport, currentTransport] = openedTransports(openTransport);
    expect(connectingTransport.disconnect).toHaveBeenCalledWith({ connectedDevice });
    expect(currentTransport.disconnect).not.toHaveBeenCalled();
  });

  it("disconnects an untracked device through the open transport", async () => {
    const transport = createTransport();
    const session = new SpeculosTransportSession(() => transport);
    session.resolve(target);

    await expect(session.disconnect({ connectedDevice })).resolves.toEqual(Right(undefined));
    expect(transport.disconnect).toHaveBeenCalledWith({ connectedDevice });
  });

  it("treats a disconnect without an open transport as a no-op", async () => {
    const session = new SpeculosTransportSession(jest.fn(createTransport));

    await expect(session.disconnect({ connectedDevice })).resolves.toEqual(Right(undefined));
  });
});
