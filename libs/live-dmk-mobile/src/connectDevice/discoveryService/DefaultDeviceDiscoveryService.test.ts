import type {
  DeviceManagementKit,
  DiscoveredDevice,
  TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { Subject, type Observable } from "rxjs";
import { DiscoveryErrors, type DiscoveryError } from "../types";
import { DefaultDeviceDiscoveryService } from "./DefaultDeviceDiscoveryService";
import type {
  DeviceDiscoverySource,
  DeviceDiscoverySourceEvent,
} from "./sources/DeviceDiscoverySource";
import { RnBleDeviceDiscoverySource } from "./sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "./sources/RnHidDeviceDiscoverySource";

jest.mock("./sources/RnBleDeviceDiscoverySource", () => ({
  RnBleDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: jest.fn(),
    transportId: "ble",
  })),
}));

jest.mock("./sources/RnHidDeviceDiscoverySource", () => ({
  RnHidDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: jest.fn(),
    transportId: "hid",
  })),
}));

const createDiscoveredDevice = (id: string, transport: TransportIdentifier): DiscoveredDevice =>
  ({
    id,
    name: id,
    deviceModel: { id: "model", model: "model", name: "model" },
    transport,
  }) as unknown as DiscoveredDevice;

const createSource = (
  transportId: TransportIdentifier,
  subject: Subject<DeviceDiscoverySourceEvent> = new Subject<DeviceDiscoverySourceEvent>(),
): DeviceDiscoverySource & { subject: Subject<DeviceDiscoverySourceEvent>; listen: jest.Mock } => ({
  transportId,
  subject,
  listen: jest.fn((): Observable<DeviceDiscoverySourceEvent> => subject.asObservable()),
});

const unknownErrorFor = (transportID: TransportIdentifier, error: unknown): DiscoveryError => ({
  type: DiscoveryErrors.Unknown,
  transportID,
  error,
});

describe("DefaultDeviceDiscoveryService", () => {
  it("GIVEN discovery has not started, WHEN subscribing to discovered devices, THEN it should emit an empty list", () => {
    // GIVEN
    const source = createSource("transport-1");
    const service = new DefaultDeviceDiscoveryService(
      {} as DeviceManagementKit,
      new Map([[source.transportId, source]]),
    );
    const discoveredDevices: DiscoveredDevice[][] = [];

    // WHEN
    const subscription = service.discoveredDevices.subscribe(devices =>
      discoveredDevices.push(devices),
    );

    // THEN
    expect(discoveredDevices).toEqual([[]]);
    subscription.unsubscribe();
  });

  it("GIVEN no source map is provided, WHEN creating the service, THEN it should build the default discovery source map", () => {
    // GIVEN
    const dmk = {
      listenToAvailableDevices: jest.fn(() => new Subject<DiscoveredDevice[]>().asObservable()),
    } as unknown as DeviceManagementKit;

    // WHEN
    const service = new DefaultDeviceDiscoveryService(dmk);

    // THEN
    expect(service.discoveredDevices).toBeDefined();
    expect(RnBleDeviceDiscoverySource).toHaveBeenCalledWith(dmk);
    expect(RnHidDeviceDiscoverySource).toHaveBeenCalledWith(dmk);
  });

  it("GIVEN all sources are started, WHEN they emit devices, THEN it should aggregate discovered devices", () => {
    // GIVEN
    const sourceA = createSource("transport-a");
    const sourceB = createSource("transport-b");
    const service = new DefaultDeviceDiscoveryService(
      {} as DeviceManagementKit,
      new Map([
        [sourceA.transportId, sourceA],
        [sourceB.transportId, sourceB],
      ]),
    );
    const discoveredDevices: DiscoveredDevice[][] = [];
    service.discoveredDevices.subscribe(devices => discoveredDevices.push(devices));
    const deviceA = createDiscoveredDevice("a", sourceA.transportId);
    const deviceB = createDiscoveredDevice("b", sourceB.transportId);

    // WHEN
    service.start();
    sourceA.subject.next({ type: "devices", devices: [deviceA] });
    sourceB.subject.next({ type: "devices", devices: [deviceB] });

    // THEN
    expect(discoveredDevices).toEqual([[], [], [deviceA], [deviceA, deviceB]]);
  });

  it("GIVEN transports are ignored, WHEN discovery starts, THEN it should not listen to ignored sources", () => {
    // GIVEN
    const sourceA = createSource("transport-a");
    const sourceB = createSource("transport-b");
    const service = new DefaultDeviceDiscoveryService(
      {} as DeviceManagementKit,
      new Map([
        [sourceA.transportId, sourceA],
        [sourceB.transportId, sourceB],
      ]),
    );

    // WHEN
    service.start({ ignoreTransportIdentifiers: [sourceB.transportId] });

    // THEN
    expect(sourceA.listen).toHaveBeenCalledTimes(1);
    expect(sourceB.listen).not.toHaveBeenCalled();
  });

  it("GIVEN a source has devices, WHEN it emits an error, THEN it should clear that source and emit the error", () => {
    // GIVEN
    const sourceA = createSource("transport-a");
    const sourceB = createSource("transport-b");
    const service = new DefaultDeviceDiscoveryService(
      {} as DeviceManagementKit,
      new Map([
        [sourceA.transportId, sourceA],
        [sourceB.transportId, sourceB],
      ]),
    );
    const discoveredDevices: DiscoveredDevice[][] = [];
    const errors: DiscoveryError[] = [];
    service.discoveredDevices.subscribe(devices => discoveredDevices.push(devices));
    service.errors.subscribe(error => errors.push(error));
    const deviceA = createDiscoveredDevice("a", sourceA.transportId);
    const deviceB = createDiscoveredDevice("b", sourceB.transportId);
    const discoveryError = unknownErrorFor(sourceA.transportId, new Error("source error"));

    // WHEN
    service.start();
    sourceA.subject.next({ type: "devices", devices: [deviceA] });
    sourceB.subject.next({ type: "devices", devices: [deviceB] });
    sourceA.subject.next({ type: "error", error: discoveryError });

    // THEN
    expect(errors).toEqual([discoveryError]);
    expect(discoveredDevices[discoveredDevices.length - 1]).toEqual([deviceB]);
  });

  it("GIVEN a source observable throws, WHEN discovery is running, THEN it should emit an unknown discovery error", () => {
    // GIVEN
    const source = createSource("transport-a");
    const service = new DefaultDeviceDiscoveryService(
      {} as DeviceManagementKit,
      new Map([[source.transportId, source]]),
    );
    const errors: DiscoveryError[] = [];
    service.errors.subscribe(error => errors.push(error));
    const error = new Error("observable error");

    // WHEN
    service.start();
    source.subject.error(error);

    // THEN
    expect(errors).toEqual([unknownErrorFor(source.transportId, error)]);
  });

  it("GIVEN a source has devices, WHEN it completes, THEN it should clear that source devices", () => {
    // GIVEN
    const source = createSource("transport-a");
    const service = new DefaultDeviceDiscoveryService(
      {} as DeviceManagementKit,
      new Map([[source.transportId, source]]),
    );
    const discoveredDevices: DiscoveredDevice[][] = [];
    service.discoveredDevices.subscribe(devices => discoveredDevices.push(devices));
    const device = createDiscoveredDevice("a", source.transportId);

    // WHEN
    service.start();
    source.subject.next({ type: "devices", devices: [device] });
    source.subject.complete();

    // THEN
    expect(discoveredDevices[discoveredDevices.length - 1]).toEqual([]);
  });

  it("GIVEN discovery is already started, WHEN starting again before stop, THEN it should not subscribe twice", () => {
    // GIVEN
    const source = createSource("transport-a");
    const service = new DefaultDeviceDiscoveryService(
      {} as DeviceManagementKit,
      new Map([[source.transportId, source]]),
    );

    // WHEN
    service.start();
    service.start();

    // THEN
    expect(source.listen).toHaveBeenCalledTimes(1);
  });

  it("GIVEN discovery has devices from multiple sources, WHEN stopping discovery, THEN it should unsubscribe all sources and emit an empty list", () => {
    // GIVEN
    const sourceA = createSource("transport-a");
    const sourceB = createSource("transport-b");
    const service = new DefaultDeviceDiscoveryService(
      {} as DeviceManagementKit,
      new Map([
        [sourceA.transportId, sourceA],
        [sourceB.transportId, sourceB],
      ]),
    );
    const discoveredDevices: DiscoveredDevice[][] = [];
    service.discoveredDevices.subscribe(devices => discoveredDevices.push(devices));
    const deviceA = createDiscoveredDevice("a", sourceA.transportId);
    const deviceB = createDiscoveredDevice("b", sourceB.transportId);

    // WHEN
    service.start();
    sourceA.subject.next({ type: "devices", devices: [deviceA] });
    sourceB.subject.next({ type: "devices", devices: [deviceB] });
    service.stop();
    sourceA.subject.next({
      type: "devices",
      devices: [createDiscoveredDevice("c", sourceA.transportId)],
    });
    sourceB.subject.next({
      type: "devices",
      devices: [createDiscoveredDevice("d", sourceB.transportId)],
    });

    // THEN
    expect(discoveredDevices).toEqual([[], [], [deviceA], [deviceA, deviceB], []]);
  });
});
