import { BehaviorSubject, Observable, Subject } from "rxjs";
import {
  DeviceManagementKit,
  DeviceModelId as DMKDeviceModelId,
  DeviceSessionState,
  DeviceSessionStateType,
  DeviceStatus,
  DiscoveredDevice,
  SendApduEmptyResponseError,
  DeviceDisconnectedBeforeSendingApdu,
  DeviceDisconnectedWhileSendingError,
} from "@ledgerhq/device-management-kit";
import { DisconnectedDevice } from "@ledgerhq/errors";
import { DeviceManagementKitHTTPProxyTransport } from "./DeviceManagementKitHTTPProxyTransport";
import {
  buildHttpProxyLegacyDeviceId,
  HTTP_PROXY_TRANSPORT_IDENTIFIER,
  httpProxyUrlSubject,
} from "./HttpProxyDmkTransport";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

jest.mock("../hooks/useDeviceManagementKit", () => ({
  getDeviceManagementKit: jest.fn(),
}));

const aMockedDeviceSessionState: DeviceSessionState = {
  deviceStatus: DeviceStatus.CONNECTED,
  sessionStateType: DeviceSessionStateType.Connected,
  deviceModelId: DMKDeviceModelId.FLEX,
};

const mockDiscoveredDevice: DiscoveredDevice = {
  id: buildHttpProxyLegacyDeviceId("http://localhost:8435"),
  name: "HTTP Proxy",
  deviceModel: {
    model: DMKDeviceModelId.NANO_X,
    name: "Nano X",
    id: DMKDeviceModelId.NANO_X,
  },
  transport: HTTP_PROXY_TRANSPORT_IDENTIFIER,
};

function createMockDMK(): DeviceManagementKit {
  return {
    getDeviceSessionState: jest.fn(),
    listenToAvailableDevices: jest.fn(),
    connect: jest.fn(),
    sendApdu: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as DeviceManagementKit;
}

type StaticFields = {
  activeUrl: string | null;
  activeSessionId: string | null;
  inFlight: { url: string; promise: Promise<string> } | null;
};

const statics = DeviceManagementKitHTTPProxyTransport as unknown as StaticFields;

function resetModuleState() {
  statics.activeUrl = null;
  statics.activeSessionId = null;
  statics.inFlight = null;
  httpProxyUrlSubject.next(null);
}

describe("DeviceManagementKitHTTPProxyTransport", () => {
  let mockDmk: DeviceManagementKit;

  beforeEach(() => {
    jest.restoreAllMocks();
    resetModuleState();
    mockDmk = createMockDMK();
    jest.mocked(getDeviceManagementKit).mockReturnValue(mockDmk);
  });

  describe("normalizeUrl", () => {
    it("should convert ws:// to http://", () => {
      expect(DeviceManagementKitHTTPProxyTransport.normalizeUrl("ws://localhost:8435")).toBe(
        "http://localhost:8435",
      );
    });

    it("should convert wss:// to https://", () => {
      expect(DeviceManagementKitHTTPProxyTransport.normalizeUrl("wss://example.com")).toBe(
        "https://example.com",
      );
    });

    it("should leave http:// URLs unchanged", () => {
      expect(DeviceManagementKitHTTPProxyTransport.normalizeUrl("http://localhost:8435")).toBe(
        "http://localhost:8435",
      );
    });

    it("should leave https:// URLs unchanged", () => {
      expect(DeviceManagementKitHTTPProxyTransport.normalizeUrl("https://example.com")).toBe(
        "https://example.com",
      );
    });
  });

  describe("open", () => {
    beforeEach(() => {
      jest.mocked(mockDmk.getDeviceSessionState).mockReturnValue(new Observable());
      jest.mocked(mockDmk.listenToAvailableDevices).mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([mockDiscoveredDevice]);
        }),
      );
      jest.mocked(mockDmk.connect).mockResolvedValue("sessionId");
    });

    it("should reuse the singleton DMK and return a transport with dmk and sessionId", async () => {
      const transport = await DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");

      expect(transport).toBeInstanceOf(DeviceManagementKitHTTPProxyTransport);
      expect(transport.dmk).toBe(mockDmk);
      expect(transport.sessionId).toBe("sessionId");
      expect(getDeviceManagementKit).toHaveBeenCalled();
    });

    it("should emit the normalized URL on the shared subject", async () => {
      await DeviceManagementKitHTTPProxyTransport.open("ws://localhost:8435");

      expect(httpProxyUrlSubject.getValue()).toBe("http://localhost:8435");
    });

    it("should call connect with the discovered device and isRefresherDisabled", async () => {
      await DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");

      expect(mockDmk.connect).toHaveBeenCalledWith({
        device: mockDiscoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
    });

    it("should filter discovery to the HTTP proxy transport identifier", async () => {
      await DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");

      expect(mockDmk.listenToAvailableDevices).toHaveBeenCalledWith({
        transport: HTTP_PROXY_TRANSPORT_IDENTIFIER,
      });
    });

    it("should reuse the existing session for the same URL", async () => {
      await DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");
      await DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");

      expect(mockDmk.connect).toHaveBeenCalledTimes(1);
    });

    it("should create a new session when the previous one was cleared by disconnect", async () => {
      const firstTransport =
        await DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");
      // Simulate what listenToDisconnect does when NOT_CONNECTED fires
      statics.activeSessionId = null;
      statics.activeUrl = null;

      jest.mocked(mockDmk.connect).mockResolvedValue("sessionId2");

      const secondTransport =
        await DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");

      expect(secondTransport.sessionId).toBe("sessionId2");
      expect(mockDmk.connect).toHaveBeenCalledTimes(2);
      expect(firstTransport.sessionId).toBe("sessionId");
    });

    it("should create a new session when the URL changes", async () => {
      await DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");
      jest.mocked(mockDmk.connect).mockResolvedValue("sessionId2");

      const second = await DeviceManagementKitHTTPProxyTransport.open("http://other:9999");

      expect(second.sessionId).toBe("sessionId2");
      expect(mockDmk.connect).toHaveBeenCalledTimes(2);
    });

    it("should give each URL its own session when concurrent opens with different URLs are in flight", async () => {
      let resolveA: (id: string) => void = () => {};
      let resolveB: (id: string) => void = () => {};
      jest
        .mocked(mockDmk.connect)
        .mockReturnValueOnce(new Promise<string>(r => (resolveA = r)))
        .mockReturnValueOnce(new Promise<string>(r => (resolveB = r)));

      const openA = DeviceManagementKitHTTPProxyTransport.open("http://a:1");
      const openB = DeviceManagementKitHTTPProxyTransport.open("http://b:2");

      // Resolve A first; B's connect must only start after A settles.
      resolveA("sessionA");
      await new Promise(r => setTimeout(r, 0));
      resolveB("sessionB");

      const [a, b] = await Promise.all([openA, openB]);

      expect(a.sessionId).toBe("sessionA");
      expect(b.sessionId).toBe("sessionB");
      expect(mockDmk.connect).toHaveBeenCalledTimes(2);
    });

    it("should dedupe concurrent opens for the same URL", async () => {
      let resolve: (id: string) => void = () => {};
      jest.mocked(mockDmk.connect).mockReturnValueOnce(new Promise<string>(r => (resolve = r)));

      const open1 = DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");
      const open2 = DeviceManagementKitHTTPProxyTransport.open("http://localhost:8435");

      resolve("sessionId");
      const [t1, t2] = await Promise.all([open1, open2]);

      expect(t1.sessionId).toBe("sessionId");
      expect(t2.sessionId).toBe("sessionId");
      expect(mockDmk.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe("close", () => {
    it("should resolve without error", async () => {
      jest.mocked(mockDmk.getDeviceSessionState).mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");

      await expect(transport.close()).resolves.toBeUndefined();
    });

    it("should unsubscribe from the device session state observable", async () => {
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");
      const emitSpy = jest.spyOn(transport, "emit");

      await transport.close();
      deviceSessionStateSubject.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });

      expect(emitSpy).not.toHaveBeenCalledWith("disconnect");
    });
  });

  describe("exchange", () => {
    it("should call dmk.sendApdu and return the combined data+statusCode buffer", async () => {
      jest.mocked(mockDmk.getDeviceSessionState).mockReturnValue(new Observable());
      jest.mocked(mockDmk.sendApdu).mockResolvedValue({
        data: Uint8Array.from([0x42, 0x21, 0x34]),
        statusCode: Uint8Array.from([0x90, 0x00]),
      });
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");
      const abortTimeoutMs = 42;

      const response = await transport.exchange(Buffer.from([0xb0, 0x01, 0x00, 0x00, 0x00]), {
        abortTimeoutMs,
      });

      expect(mockDmk.sendApdu).toHaveBeenCalledWith({
        sessionId: "session",
        apdu: Uint8Array.from([0xb0, 0x01, 0x00, 0x00, 0x00]),
        abortTimeout: abortTimeoutMs,
      });
      expect(response).toEqual(Buffer.from([0x42, 0x21, 0x34, 0x90, 0x00]));
    });

    it("should re-throw unknown errors", async () => {
      jest.mocked(mockDmk.getDeviceSessionState).mockReturnValue(new Observable());
      jest.mocked(mockDmk.sendApdu).mockRejectedValue(new Error("unknown error"));
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");

      await expect(transport.exchange(Buffer.from([0x00]))).rejects.toThrow("unknown error");
    });

    [
      new SendApduEmptyResponseError(),
      new DeviceDisconnectedWhileSendingError(),
      new DeviceDisconnectedBeforeSendingApdu(),
    ].forEach(error => {
      it(`should remap ${error.constructor.name} to DisconnectedDevice`, async () => {
        jest.mocked(mockDmk.getDeviceSessionState).mockReturnValue(new Observable());
        jest.mocked(mockDmk.sendApdu).mockRejectedValue(error);
        const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");

        let caughtError: unknown;
        await transport.exchange(Buffer.from([0x00])).catch(e => {
          caughtError = e;
        });

        expect(caughtError).toEqual(new DisconnectedDevice());
      });
    });
  });

  describe("listenToDisconnect", () => {
    it("should be called on new transport", () => {
      jest.mocked(mockDmk.getDeviceSessionState).mockReturnValue(new Observable());
      jest.spyOn(DeviceManagementKitHTTPProxyTransport.prototype, "listenToDisconnect");

      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");

      expect(transport.listenToDisconnect).toHaveBeenCalled();
    });

    it("should clear the cached session and emit disconnect on NOT_CONNECTED", () => {
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      statics.activeUrl = "http://localhost:8435";
      statics.activeSessionId = "session";
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");
      jest.spyOn(transport, "emit");

      deviceSessionStateSubject.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });

      expect(statics.activeSessionId).toBeNull();
      expect(statics.activeUrl).toBeNull();
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("should not clear the active cache when a stale instance fires NOT_CONNECTED for a different session", () => {
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      // Active session belongs to a different (newer) instance.
      statics.activeUrl = "http://localhost:9999";
      statics.activeSessionId = "current-session";
      // Stale transport built earlier for an older session.
      const staleTransport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "stale-session");
      jest.spyOn(staleTransport, "emit");

      deviceSessionStateSubject.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });

      expect(statics.activeSessionId).toBe("current-session");
      expect(statics.activeUrl).toBe("http://localhost:9999");
      // Stale instance still emits its own disconnect for any local listeners.
      expect(staleTransport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("should not emit disconnect for non-NOT_CONNECTED states", () => {
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");
      jest.spyOn(transport, "emit");

      deviceSessionStateSubject.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.BUSY,
      });

      expect(transport.emit).not.toHaveBeenCalled();
    });

    it("should emit disconnect when the state observable completes", () => {
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");
      jest.spyOn(transport, "emit");

      deviceSessionStateSubject.complete();

      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("should emit disconnect when the state observable errors", () => {
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");
      jest.spyOn(transport, "emit");

      deviceSessionStateSubject.error(new Error("state error"));

      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("should not throw when the observable emits NOT_CONNECTED synchronously on subscribe", () => {
      const deviceSessionStateSubject = new BehaviorSubject<DeviceSessionState>({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());

      expect(() => new DeviceManagementKitHTTPProxyTransport(mockDmk, "session")).not.toThrow();
    });

    it("should unsubscribe even when NOT_CONNECTED is emitted synchronously on subscribe", () => {
      const deviceSessionStateSubject = new BehaviorSubject<DeviceSessionState>({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());

      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");

      expect(transport["disconnectSubscription"]?.closed).toBe(true);
    });

    it("should emit disconnect only once even if NOT_CONNECTED fires multiple times", () => {
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDmk.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      const transport = new DeviceManagementKitHTTPProxyTransport(mockDmk, "session");
      const emitSpy = jest.spyOn(transport, "emit");

      deviceSessionStateSubject.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });
      deviceSessionStateSubject.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });

      expect(emitSpy.mock.calls.filter(c => c[0] === "disconnect")).toHaveLength(1);
    });
  });
});
