/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import DeviceManagementKitTransportSpeculos, {
  SpeculosButton,
} from "./DeviceManagementKitTransportSpeculos";
import axios from "axios";
import net from "net";
import {
  DeviceManagementKitBuilder,
  DeviceModelId,
  DiscoveredDevice,
  DeviceSessionState,
  DeviceStatus,
  DeviceSessionStateType,
} from "@ledgerhq/device-management-kit";
import * as speculosTransportFactoryModule from "@ledgerhq/device-transport-kit-speculos";
import { EventEmitter } from "events";
import { Subject } from "rxjs";
import { DisconnectedDevice } from "@ledgerhq/errors";

const flushPromises = () => new Promise(setImmediate);

let listenSubject: Subject<DiscoveredDevice[]>;
let stateSubject: Subject<DeviceSessionState>;
let fakeDmk: any;
let mockStream: any;
let httpMock: any;

beforeAll(() => {
  class FakeSocket {
    callbacks: Record<string, () => void> = {};
    setTimeout() {}
    once(event: string, cb: () => void) {
      this.callbacks[event] = cb;
      return this;
    }
    connect(_port: number, _host: string) {
      this.callbacks.connect();
      return this;
    }
    destroy() {}
  }

  (net as any).Socket = FakeSocket as any;

  listenSubject = new Subject<DiscoveredDevice[]>();
  stateSubject = new Subject<DeviceSessionState>();

  fakeDmk = {
    listenToAvailableDevices: vi.fn().mockImplementation(() => listenSubject.asObservable()),
    connect: vi.fn().mockResolvedValue("session-1"),
    getDeviceSessionState: vi.fn().mockImplementation(() => stateSubject.asObservable()),
    sendApdu: vi.fn(),
    disconnect: vi.fn(),
  };

  vi.spyOn(DeviceManagementKitBuilder.prototype, "addTransport").mockReturnThis();
  vi.spyOn(DeviceManagementKitBuilder.prototype, "addLogger").mockReturnThis();
  vi.spyOn(DeviceManagementKitBuilder.prototype, "build").mockReturnValue(fakeDmk);

  vi.spyOn(speculosTransportFactoryModule, "speculosTransportFactory").mockReturnValue(
    //@ts-expect-error mock
    "fake-transport",
  );

  mockStream = new EventEmitter();
  (mockStream as any).destroy = vi.fn();
  httpMock = vi.fn().mockResolvedValue({ data: mockStream });
  httpMock.post = vi.fn().mockResolvedValue({});
  vi.spyOn(axios, "create").mockReturnValue(httpMock as any);
});

afterEach(() => {
  vi.clearAllMocks();
  listenSubject = new Subject<DiscoveredDevice[]>();
  stateSubject = new Subject<DeviceSessionState>();
});

describe("DeviceManagementKitTransportSpeculos", () => {
  it("isSupported() resolves to true", async () => {
    await expect(DeviceManagementKitTransportSpeculos.isSupported()).resolves.toBe(true);
  });

  it("list() resolves to an empty array", async () => {
    await expect(DeviceManagementKitTransportSpeculos.list()).resolves.toEqual([]);
  });

  it("listen() returns an object with unsubscribe()", () => {
    const sub = DeviceManagementKitTransportSpeculos.listen({});
    expect(sub).toHaveProperty("unsubscribe");
    expect(() => sub.unsubscribe()).not.toThrow();
  });

  it("open() successfully opens a transport instance", async () => {
    // given
    const openPromise = DeviceManagementKitTransportSpeculos.open({
      apiPort: "1234",
    });
    await flushPromises();
    listenSubject.next([
      {
        id: "dev-1",
        deviceModel: {
          id: "dm-1",
          model: DeviceModelId.STAX,
          name: "stax",
        },
        rssi: undefined,
        name: "test-device",
        transport: "web-hid",
      },
    ]);

    // when
    const transport = await openPromise;

    // then
    expect(transport).toBeInstanceOf(DeviceManagementKitTransportSpeculos);
  });

  it.each([
    [SpeculosButton.LEFT, "/button/Ll"],
    [SpeculosButton.RIGHT, "/button/Rr"],
    [SpeculosButton.BOTH, "/button/LRlr"],
  ])('button posts to "%s"', async (buttonEnum, expectedUrl) => {
    // given
    const transport = new (DeviceManagementKitTransportSpeculos as any)(
      httpMock,
      fakeDmk,
      "session-1",
    );
    httpMock.post.mockClear();

    // when
    await transport.button(buttonEnum);

    // then
    expect(httpMock.post).toHaveBeenCalledWith(expectedUrl, {
      action: "press-and-release",
    });
  });

  it("propagates errors from button() HTTP call", async () => {
    // given
    const transport = new (DeviceManagementKitTransportSpeculos as any)(
      httpMock,
      fakeDmk,
      "session-1",
    );

    // when
    httpMock.post.mockRejectedValue(new Error("button-failed"));

    // then
    await expect(transport.button(SpeculosButton.LEFT)).rejects.toThrow("button-failed");
  });

  it("exchange() sends an APDU and returns the full response buffer", async () => {
    // given
    fakeDmk.sendApdu.mockResolvedValue({
      data: Uint8Array.from([0x90]),
      statusCode: new Uint8Array([0x00]),
    });
    const transport = new (DeviceManagementKitTransportSpeculos as any)(
      httpMock,
      fakeDmk,
      "session-1",
    );
    const apdu = Buffer.from([0x00, 0x01]);

    // when
    const resp = await transport.exchange(apdu);

    // then
    expect(fakeDmk.sendApdu).toHaveBeenCalledWith({
      sessionId: "session-1",
      apdu: Uint8Array.from(apdu),
    });
    expect(resp).toEqual(Buffer.from([0x90, 0x00]));
  });

  it("propagates errors from exchange() when sendApdu fails", async () => {
    // given
    const transport = new (DeviceManagementKitTransportSpeculos as any)(
      httpMock,
      fakeDmk,
      "session-1",
    );

    // when
    fakeDmk.sendApdu.mockRejectedValue(new Error("apdu-failed"));

    // then
    await expect(transport.exchange(Buffer.from([0x00]))).rejects.toThrow("apdu-failed");
  });

  it("automationEvents emits parsed JSON lines from the SSE stream", async () => {
    // given
    const transport = new (DeviceManagementKitTransportSpeculos as any)(
      httpMock,
      fakeDmk,
      "session-1",
    );
    await flushPromises();

    const received: any[] = [];
    transport.automationEvents.subscribe((e: any) => received.push(e));

    // when
    const payload = { all: "good?" };
    mockStream.emit("data", Buffer.from(`data: ${JSON.stringify(payload)}\n`));

    // then
    expect(received).toEqual([payload]);
  });

  it("emits a Transport 'disconnect' when the SSE stream closes", async () => {
    // given
    const transport = new (DeviceManagementKitTransportSpeculos as any)(
      httpMock,
      fakeDmk,
      "session-1",
    );
    await flushPromises();

    const errors: any[] = [];
    transport.on("disconnect", (err: any) => errors.push(err));

    // when
    mockStream.emit("close");

    // then
    expect(errors.length).toBe(1);
    expect(errors[0]).toBeInstanceOf(DisconnectedDevice);
    expect(errors[0].message).toBe("Speculos exited");
  });

  it("emits Transport disconnect when DMK state goes to NOT_CONNECTED", () => {
    // given
    const transport = new (DeviceManagementKitTransportSpeculos as any)(
      httpMock,
      fakeDmk,
      "session-1",
    );
    const calls: any[] = [];

    transport.on("disconnect", (err: Error): void => {
      calls.push(err);
    });

    // when
    stateSubject.next({
      deviceStatus: DeviceStatus.NOT_CONNECTED,
      sessionStateType: DeviceSessionStateType.ReadyWithSecureChannel,
      deviceModelId: DeviceModelId.STAX,
      currentApp: { name: "mockedCurrentApp", version: "1.0.0" },
      installedApps: [],
      isSecureConnectionAllowed: false,
    });

    // then
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBeUndefined();
  });
});
