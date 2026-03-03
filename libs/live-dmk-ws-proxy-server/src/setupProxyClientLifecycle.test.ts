import type WebSocket from "ws";
import type { WebSocketServer } from "ws";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import type { ProxyRuntimeContext } from "./createProxyContext";
import { setupProxyClientLifecycle } from "./setupProxyClientLifecycle";
import { sendToClient, mapDiscoveredDeviceToWsProxyDeviceInfo } from "./messaging";
import { ProxyClientSessionHandler } from "./proxyClientSessionHandler";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));
jest.mock("./messaging", () => ({
  sendToClient: jest.fn(() => true),
  mapDiscoveredDeviceToWsProxyDeviceInfo: jest.fn((device: { id: string; deviceModel: any }) => ({
    id: device.id,
    deviceModel: {
      id: device.deviceModel.model,
      productName: device.deviceModel.name,
    },
  })),
}));
jest.mock("./proxyClientSessionHandler", () => ({
  ProxyClientSessionHandler: jest.fn(),
}));

type SocketHandler = (...args: any[]) => any;
const makeDiscoveredDevice = (id: string): DiscoveredDevice =>
  ({
    id,
    deviceModel: { model: "nanoX", name: "Nano X" },
  }) as unknown as DiscoveredDevice;

const createSocketMock = () => {
  const handlers = new Map<string, SocketHandler>();
  const ws = {
    on: jest.fn((event: string, handler: SocketHandler) => {
      handlers.set(event, handler);
      return ws;
    }),
  } as unknown as WebSocket;
  return { ws, handlers };
};

const createServerMock = () => {
  const handlers = new Map<string, SocketHandler>();
  const wss = {
    on: jest.fn((event: string, handler: SocketHandler) => {
      handlers.set(event, handler);
      return wss;
    }),
  } as unknown as WebSocketServer;
  return { wss, handlers };
};

describe("setupProxyClientLifecycle", () => {
  let runtimeContext: ProxyRuntimeContext;
  let sessionHandler: {
    handleConnect: jest.Mock<Promise<void>, [string, string]>;
    handleSendApdu: jest.Mock<Promise<void>, [string, string, string, number?]>;
    handleDisconnect: jest.Mock<Promise<void>, [string?]>;
  };

  beforeEach(() => {
    sessionHandler = {
      handleConnect: jest.fn().mockResolvedValue(undefined),
      handleSendApdu: jest.fn().mockResolvedValue(undefined),
      handleDisconnect: jest.fn().mockResolvedValue(undefined),
    };
    jest
      .mocked(ProxyClientSessionHandler)
      .mockImplementation(() => sessionHandler as unknown as ProxyClientSessionHandler);

    runtimeContext = {
      resolvedPort: "8435",
      dmk: {} as ProxyRuntimeContext["dmk"],
      clients: new Set<WebSocket>(),
      getDiscoveredDevices: jest.fn(() => [makeDiscoveredDevice("device-1")]),
      setDiscoveredDevices: jest.fn(),
    };
  });

  it("should wire a new connection and send the initial discovered devices snapshot", () => {
    const { wss, handlers: wssHandlers } = createServerMock();
    const { ws } = createSocketMock();

    setupProxyClientLifecycle({ runtimeContext, wss });
    expect(wss.on).toHaveBeenCalledWith("connection", expect.any(Function));

    const connectionHandler = wssHandlers.get("connection");
    expect(connectionHandler).toBeDefined();
    connectionHandler?.(ws);

    expect(ProxyClientSessionHandler).toHaveBeenCalledWith(
      runtimeContext.dmk,
      runtimeContext.getDiscoveredDevices,
      ws,
      sendToClient,
    );
    expect(runtimeContext.clients.has(ws)).toBe(true);
    expect(mapDiscoveredDeviceToWsProxyDeviceInfo).toHaveBeenNthCalledWith(
      1,
      {
        id: "device-1",
        deviceModel: { model: "nanoX", name: "Nano X" },
      },
      0,
      expect.any(Array),
    );
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "discovered-devices-updated",
      discoveredDevices: [{ id: "device-1", deviceModel: { id: "nanoX", productName: "Nano X" } }],
    });
  });

  it("should route connect/send-apdu/disconnect messages to the session handler", async () => {
    const { wss, handlers: wssHandlers } = createServerMock();
    const { ws, handlers: wsHandlers } = createSocketMock();

    setupProxyClientLifecycle({ runtimeContext, wss });
    wssHandlers.get("connection")?.(ws);

    const messageHandler = wsHandlers.get("message");
    expect(messageHandler).toBeDefined();

    await messageHandler?.(
      Buffer.from(JSON.stringify({ type: "connect", deviceId: "d1", requestId: "r1" })),
    );
    expect(sessionHandler.handleConnect).toHaveBeenCalledWith("d1", "r1");

    await messageHandler?.(
      Buffer.from(
        JSON.stringify({ type: "send-apdu", deviceId: "d1", requestId: "r2", data: "00a4" }),
      ),
    );
    expect(sessionHandler.handleSendApdu).toHaveBeenCalledWith("d1", "r2", "00a4", undefined);

    await messageHandler?.(
      Buffer.from(
        JSON.stringify({
          type: "send-apdu",
          deviceId: "d1",
          requestId: "r2b",
          data: "00a4",
          abortTimeoutMs: 1234,
        }),
      ),
    );
    expect(sessionHandler.handleSendApdu).toHaveBeenCalledWith("d1", "r2b", "00a4", 1234);

    await messageHandler?.(
      Buffer.from(JSON.stringify({ type: "disconnect", deviceId: "d1", requestId: "r3" })),
    );
    expect(sessionHandler.handleDisconnect).toHaveBeenCalledWith("d1");
  });

  it("should report invalid JSON messages", async () => {
    const { wss, handlers: wssHandlers } = createServerMock();
    const { ws, handlers: wsHandlers } = createSocketMock();

    setupProxyClientLifecycle({ runtimeContext, wss });
    wssHandlers.get("connection")?.(ws);

    const messageHandler = wsHandlers.get("message");
    await messageHandler?.(Buffer.from("{not-json"));

    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "error",
      message: "Invalid JSON",
    });
  });

  it("should cleanup client state when websocket closes", () => {
    const { wss, handlers: wssHandlers } = createServerMock();
    const { ws, handlers: wsHandlers } = createSocketMock();

    setupProxyClientLifecycle({ runtimeContext, wss });
    wssHandlers.get("connection")?.(ws);
    expect(runtimeContext.clients.has(ws)).toBe(true);

    wsHandlers.get("close")?.();

    expect(sessionHandler.handleDisconnect).toHaveBeenCalledWith();
    expect(runtimeContext.clients.has(ws)).toBe(false);
  });
});
