import WebSocket from "ws";
import { Subject } from "rxjs";
import {
  DeviceStatus,
  type DeviceManagementKit,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import type { WsServerMessage } from "@ledgerhq/live-dmk-ws-proxy-shared";
import { ProxyClientSessionHandler } from "./proxyClientSessionHandler";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

type SessionStateObserver = {
  next: (state: { deviceStatus: DeviceStatus }) => void;
  error: (error: unknown) => void;
};

const makeDiscoveredDevice = (id: string): DiscoveredDevice =>
  ({
    id,
    deviceModel: {
      model: "nanoX",
      name: `Ledger ${id}`,
    },
  }) as unknown as DiscoveredDevice;

type MockedDmk = {
  dmk: jest.Mocked<
    Pick<DeviceManagementKit, "connect" | "disconnect" | "sendApdu" | "getDeviceSessionState">
  >;
  subjectsBySessionId: Map<string, Subject<{ deviceStatus: DeviceStatus }>>;
};

const createMockedDmk = (): MockedDmk => {
  const subjectsBySessionId = new Map<string, Subject<{ deviceStatus: DeviceStatus }>>();
  const dmk = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendApdu: jest.fn(),
    getDeviceSessionState: jest.fn(({ sessionId }: { sessionId: string }) => {
      const subject = new Subject<{ deviceStatus: DeviceStatus }>();
      subjectsBySessionId.set(sessionId, subject);
      return subject.asObservable();
    }),
  } as unknown as MockedDmk["dmk"];

  return { dmk, subjectsBySessionId };
};

describe("ProxyClientSessionHandler", () => {
  let ws: WebSocket;
  let sendToClient: jest.Mock<boolean, [WebSocket, WsServerMessage]>;
  let discoveredDevices: DiscoveredDevice[];
  let getDiscoveredDevices: jest.Mock<DiscoveredDevice[], []>;
  let dmk: MockedDmk["dmk"];
  let subjectsBySessionId: Map<string, Subject<{ deviceStatus: DeviceStatus }>>;
  let handler: ProxyClientSessionHandler;

  beforeEach(() => {
    ws = {} as WebSocket;
    sendToClient = jest.fn<boolean, [WebSocket, WsServerMessage]>(() => true);
    discoveredDevices = [makeDiscoveredDevice("device-1"), makeDiscoveredDevice("device-2")];
    getDiscoveredDevices = jest.fn(() => discoveredDevices);

    ({ dmk, subjectsBySessionId } = createMockedDmk());
    handler = new ProxyClientSessionHandler(
      dmk as unknown as DeviceManagementKit,
      getDiscoveredDevices,
      ws,
      sendToClient,
    );
  });

  it("should send an error when trying to connect an unknown device", async () => {
    discoveredDevices = [];

    await handler.handleConnect("missing-device", "req-1");

    expect(dmk.connect).not.toHaveBeenCalled();
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "error",
      requestId: "req-1",
      deviceId: "missing-device",
      message: "Device missing-device not found",
    });
  });

  it("should connect and disconnect on NOT_CONNECTED session state updates", async () => {
    dmk.connect.mockResolvedValue("session-1");

    await handler.handleConnect("device-1", "req-1");

    expect(dmk.connect).toHaveBeenCalledWith({
      device: discoveredDevices[0],
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "device-connected",
      requestId: "req-1",
      deviceId: "device-1",
      sessionId: "session-1",
      deviceModel: {
        id: "nanoX",
        productName: "Ledger device-1",
      },
    });

    const subject = subjectsBySessionId.get("session-1");
    expect(subject).toBeDefined();

    subject?.next({ deviceStatus: DeviceStatus.CONNECTED });
    expect(sendToClient).toHaveBeenCalledTimes(1);

    subject?.next({ deviceStatus: DeviceStatus.NOT_CONNECTED });
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "device-disconnected",
      deviceId: "device-1",
    });
  });

  it("should reuse an existing session and fallback model when device left discovery", async () => {
    dmk.connect.mockResolvedValue("session-1");

    await handler.handleConnect("device-1", "req-1");
    sendToClient.mockClear();

    await handler.handleConnect("device-1", "req-2");
    expect(dmk.connect).toHaveBeenCalledTimes(1);
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "device-connected",
      requestId: "req-2",
      deviceId: "device-1",
      sessionId: "session-1",
      deviceModel: {
        id: "nanoX",
        productName: "Ledger device-1",
      },
    });

    discoveredDevices = [];
    sendToClient.mockClear();
    await handler.handleConnect("device-1", "req-3");
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "device-connected",
      requestId: "req-3",
      deviceId: "device-1",
      sessionId: "session-1",
      deviceModel: {
        id: "nanoX",
        productName: "Ledger Device",
      },
    });
  });

  it("should stringify non-error connection failures", async () => {
    dmk.connect.mockRejectedValue("connect failed");

    await handler.handleConnect("device-1", "req-1");

    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "error",
      requestId: "req-1",
      deviceId: "device-1",
      message: "connect failed",
    });
  });

  it("should send an error when APDU is requested without active session", async () => {
    await handler.handleSendApdu("device-1", "req-apdu", "e001");

    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "error",
      requestId: "req-apdu",
      deviceId: "device-1",
      message: "No active session",
    });
  });

  it("should send APDU to DMK and forward an apdu-response", async () => {
    dmk.connect.mockResolvedValue("session-1");
    dmk.sendApdu.mockResolvedValue({
      data: new Uint8Array([0xaa]),
      statusCode: new Uint8Array([0x90, 0x00]),
    });

    await handler.handleConnect("device-1", "req-connect");
    sendToClient.mockClear();

    await handler.handleSendApdu("device-1", "req-apdu", "e001");

    expect(dmk.sendApdu).toHaveBeenCalledWith({
      sessionId: "session-1",
      apdu: new Uint8Array([0xe0, 0x01]),
    });
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "apdu-response",
      requestId: "req-apdu",
      deviceId: "device-1",
      data: "aa9000",
    });
  });

  it("should forward APDU abort timeout to DMK", async () => {
    dmk.connect.mockResolvedValue("session-1");
    dmk.sendApdu.mockResolvedValue({
      data: new Uint8Array([]),
      statusCode: new Uint8Array([0x90, 0x00]),
    });

    await handler.handleConnect("device-1", "req-connect");
    sendToClient.mockClear();

    await handler.handleSendApdu("device-1", "req-apdu", "e001", 1500);

    expect(dmk.sendApdu).toHaveBeenCalledWith({
      sessionId: "session-1",
      apdu: new Uint8Array([0xe0, 0x01]),
      abortTimeout: 1500,
    });
  });

  it("should support empty APDU payloads", async () => {
    dmk.connect.mockResolvedValue("session-1");
    dmk.sendApdu.mockResolvedValue({
      data: new Uint8Array([]),
      statusCode: new Uint8Array([0x90, 0x00]),
    });

    await handler.handleConnect("device-1", "req-connect");
    sendToClient.mockClear();

    await handler.handleSendApdu("device-1", "req-apdu", "");

    expect(dmk.sendApdu).toHaveBeenCalledWith({
      sessionId: "session-1",
      apdu: new Uint8Array([]),
    });
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "apdu-response",
      requestId: "req-apdu",
      deviceId: "device-1",
      data: "9000",
    });
  });

  it("should reject malformed APDU payloads before calling DMK", async () => {
    dmk.connect.mockResolvedValue("session-1");

    await handler.handleConnect("device-1", "req-connect");
    sendToClient.mockClear();

    await handler.handleSendApdu("device-1", "req-apdu-1", "e0010");
    await handler.handleSendApdu("device-1", "req-apdu-2", "zz");

    expect(dmk.sendApdu).not.toHaveBeenCalled();
    expect(sendToClient).toHaveBeenNthCalledWith(1, ws, {
      type: "error",
      requestId: "req-apdu-1",
      deviceId: "device-1",
      message: "Invalid APDU hex payload",
    });
    expect(sendToClient).toHaveBeenNthCalledWith(2, ws, {
      type: "error",
      requestId: "req-apdu-2",
      deviceId: "device-1",
      message: "Invalid APDU hex payload",
    });
  });

  it("should forward APDU errors", async () => {
    dmk.connect.mockResolvedValue("session-1");
    dmk.sendApdu.mockRejectedValue(new Error("apdu failure"));

    await handler.handleConnect("device-1", "req-connect");
    sendToClient.mockClear();

    await handler.handleSendApdu("device-1", "req-apdu", "e001");

    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "error",
      requestId: "req-apdu",
      deviceId: "device-1",
      message: "apdu failure",
    });
  });

  it("should disconnect one device and ignore unknown ones", async () => {
    dmk.connect.mockResolvedValueOnce("session-1").mockResolvedValueOnce("session-2");
    dmk.disconnect.mockResolvedValue(undefined);

    await handler.handleConnect("device-1", "req-1");
    await handler.handleConnect("device-2", "req-2");

    await handler.handleDisconnect("missing-device");
    expect(dmk.disconnect).not.toHaveBeenCalled();

    await handler.handleDisconnect("device-1");
    expect(dmk.disconnect).toHaveBeenCalledTimes(1);
    expect(dmk.disconnect).toHaveBeenCalledWith({ sessionId: "session-1" });
  });

  it("should disconnect all sessions and swallow DMK disconnect failures", async () => {
    dmk.connect.mockResolvedValueOnce("session-1").mockResolvedValueOnce("session-2");
    dmk.disconnect
      .mockRejectedValueOnce(new Error("already gone"))
      .mockResolvedValueOnce(undefined);

    await handler.handleConnect("device-1", "req-1");
    await handler.handleConnect("device-2", "req-2");
    await handler.handleDisconnect();

    expect(dmk.disconnect).toHaveBeenCalledTimes(2);
    expect(dmk.disconnect).toHaveBeenNthCalledWith(1, { sessionId: "session-1" });
    expect(dmk.disconnect).toHaveBeenNthCalledWith(2, { sessionId: "session-2" });

    sendToClient.mockClear();
    await handler.handleSendApdu("device-1", "req-apdu", "e001");
    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "error",
      requestId: "req-apdu",
      deviceId: "device-1",
      message: "No active session",
    });
  });

  it("should handle session-state stream errors by disconnecting the device", async () => {
    dmk.connect.mockResolvedValue("session-1");

    await handler.handleConnect("device-1", "req-1");
    sendToClient.mockClear();

    const subject = subjectsBySessionId.get("session-1");
    expect(subject).toBeDefined();
    subject?.error(new Error("stream failure"));

    expect(sendToClient).toHaveBeenCalledWith(ws, {
      type: "device-disconnected",
      deviceId: "device-1",
    });
  });

  it("should ignore stale session-state callbacks", async () => {
    const observerRef: { current: SessionStateObserver | null } = { current: null };
    dmk.connect.mockResolvedValue("session-1");
    dmk.getDeviceSessionState.mockReturnValue({
      subscribe: (candidate: SessionStateObserver) => {
        observerRef.current = candidate;
        return { unsubscribe: jest.fn() };
      },
    } as unknown as ReturnType<DeviceManagementKit["getDeviceSessionState"]>);

    await handler.handleConnect("device-1", "req-1");
    await handler.handleDisconnect("device-1");
    sendToClient.mockClear();

    observerRef.current?.next({ deviceStatus: DeviceStatus.NOT_CONNECTED });
    observerRef.current?.error(new Error("stream failure"));

    expect(sendToClient).not.toHaveBeenCalled();
  });

  it("should unsubscribe when the session is removed synchronously during subscription", async () => {
    dmk.connect.mockResolvedValue("session-1");
    const unsubscribe = jest.fn();
    dmk.getDeviceSessionState.mockReturnValue({
      subscribe: (observer: SessionStateObserver) => {
        observer.next({ deviceStatus: DeviceStatus.NOT_CONNECTED });
        return { unsubscribe };
      },
    } as unknown as ReturnType<DeviceManagementKit["getDeviceSessionState"]>);

    await handler.handleConnect("device-1", "req-1");

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
