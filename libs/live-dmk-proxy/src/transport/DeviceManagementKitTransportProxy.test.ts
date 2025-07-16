/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
// speculos.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Subject } from "rxjs";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  DeviceStatus,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";

import {
  createStaticProxyTransport,
  HttpProxyTransport,
  WsProxyTransport,
  type ProxyOpts,
} from "./DeviceManagementKitTransportProxy";

let fakeDMK: Partial<DeviceManagementKit>;
let available$: Subject<DiscoveredDevice[]>;
let state$: Subject<{ deviceStatus: DeviceStatus }>;

beforeEach(() => {
  available$ = new Subject();
  state$ = new Subject();

  fakeDMK = {
    listenToAvailableDevices: vi.fn().mockReturnValue(available$.asObservable()),
    connect: vi.fn().mockResolvedValue("sess-1"),
    sendApdu: vi.fn().mockResolvedValue({
      data: Uint8Array.from([0x01, 0x02]),
      statusCode: Uint8Array.from([0x90, 0x00]),
    }),
    getDeviceSessionState: vi.fn().mockReturnValue(state$.asObservable()),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };

  vi.spyOn(DeviceManagementKitBuilder.prototype, "addTransport").mockReturnThis();
  vi.spyOn(DeviceManagementKitBuilder.prototype, "addLogger").mockReturnThis();
  vi.spyOn(DeviceManagementKitBuilder.prototype, "build").mockReturnValue(fakeDMK as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HttpProxyTransport", () => {
  it("static API", async () => {
    expect(await HttpProxyTransport.isSupported()).toBe(true);
    expect(await HttpProxyTransport.list()).toEqual([]);
    const sub = HttpProxyTransport.listen({ next: () => {} } as any);
    expect(typeof sub.unsubscribe).toBe("function");
  });

  it("open() waits for discovery and returns instance", async () => {
    const opts: ProxyOpts = { url: "http://localhost:5000", timeout: 10 };
    const openPromise = HttpProxyTransport.open(opts);
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    const transport = await openPromise;

    expect(transport).toBeInstanceOf(HttpProxyTransport);
    expect(fakeDMK!.connect).toHaveBeenCalledWith({
      device: expect.objectContaining({ id: "d1" }),
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
  });

  it("exchange() and close()", async () => {
    const opts: ProxyOpts = { url: "http://localhost:5000", timeout: 10 };
    const openPromise = HttpProxyTransport.open(opts);
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    const transport = await openPromise;

    const apdu = Buffer.from([0x00]);
    const resp = await (transport as HttpProxyTransport).exchange(apdu);
    expect(fakeDMK!.sendApdu).toHaveBeenCalledWith({
      sessionId: "sess-1",
      apdu: Uint8Array.from(apdu),
    });
    expect(resp).toEqual(Buffer.from([0x01, 0x02, 0x90, 0x00]));

    await expect(transport.close()).resolves.toBeUndefined();
    expect(fakeDMK!.disconnect).toHaveBeenCalledWith({ sessionId: "sess-1" });
  });
});

describe("WsProxyTransport", () => {
  it("static API", async () => {
    expect(await WsProxyTransport.isSupported()).toBe(true);
    expect(await WsProxyTransport.list()).toEqual([]);
    const sub = WsProxyTransport.listen({ next: () => {} } as any);
    expect(typeof sub.unsubscribe).toBe("function");
  });

  it("open() and exchange()", async () => {
    const opts: ProxyOpts = { url: "ws://localhost:5000", timeout: 10 };
    const openPromise = WsProxyTransport.open(opts);
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    const transport = await openPromise;

    expect(transport).toBeInstanceOf(WsProxyTransport);

    const apdu = Buffer.from([0xaa]);
    const resp = await (transport as WsProxyTransport).exchange(apdu);
    expect(resp).toEqual(Buffer.from([0x01, 0x02, 0x90, 0x00]));
  });

  it("close()", async () => {
    const opts: ProxyOpts = { url: "ws://localhost:5000", timeout: 10 };
    const openPromise = WsProxyTransport.open(opts);
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    const transport = await openPromise;

    await transport.close();
    expect(fakeDMK!.disconnect).toHaveBeenCalledWith({ sessionId: "sess-1" });
  });
});

describe("SpeculosStaticTransport", () => {
  const Static = createStaticProxyTransport(async () => ["http://1", "ws://2"]);

  it("list() filters unreachable URLs by checking connectivity", async () => {
    // given
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as any));
    class MockWebSocket {
      onopen!: () => void;
      onerror!: (err: any) => void;
      constructor(_url: string) {
        setTimeout(() => this.onopen(), 0);
      }
      close() {}
    }
    vi.stubGlobal("WebSocket", MockWebSocket);
    // when
    const result = await Static.list();

    // then
    expect(result).toEqual(["http://1", "ws://2"]);
  });

  it("open() picks correct adaptor", async () => {
    // HTTP
    const httpPromise = Static.open("http://any");
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    const httpT = await httpPromise;
    expect(httpT).toBeInstanceOf(HttpProxyTransport);

    // WS
    const wsPromise = Static.open("ws://any");
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    const wsT = await wsPromise;
    expect(wsT).toBeInstanceOf(WsProxyTransport);
  });
});

describe("error and edge cases", () => {
  const URL = "http://localhost:5000" as const;
  const WS_URL = "ws://localhost:5000" as const;

  it("HTTP.open() times out if no device appears", async () => {
    await expect(HttpProxyTransport.open({ url: URL, timeout: 5 })).rejects.toThrow(/timeout/i);
  });

  it("HTTP.open() propagates connect() rejection", async () => {
    // stub *before*
    (fakeDMK!.connect as any).mockRejectedValueOnce(new Error("connect-failed"));

    const opts: ProxyOpts = { url: URL, timeout: 10 };
    const openPromise = HttpProxyTransport.open(opts);
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    await expect(openPromise).rejects.toThrow("connect-failed");
  });

  it("exchange() throws and emits disconnect on sendApdu error (HTTP)", async () => {
    const openPromise = HttpProxyTransport.open({ url: URL, timeout: 10 });
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    const transport = await openPromise;

    // stub sendApdu *before* calling exchange
    (fakeDMK!.sendApdu as any).mockRejectedValueOnce(new Error("send-failed"));

    const onDisc = vi.fn();
    transport.on("disconnect", onDisc);

    await expect(transport.exchange(Buffer.from([0x00]))).rejects.toThrow("send-failed");
    expect(onDisc).toHaveBeenCalled();
  });

  it("Ws.open() propagates connect() rejection", async () => {
    (fakeDMK!.connect as any).mockRejectedValueOnce(new Error("ws-connect-fail"));

    const opts: ProxyOpts = { url: WS_URL, timeout: 10 };
    const openPromise = WsProxyTransport.open(opts);
    available$.next([
      { id: "d1", name: "TestDevice", deviceModel: { blockSize: 32 }, transport: "" },
    ] as unknown as DiscoveredDevice[]);
    await expect(openPromise).rejects.toThrow("ws-connect-fail");
  });
});
