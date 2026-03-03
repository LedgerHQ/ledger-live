import type { TransportArgs, TransportConnectedDevice } from "@ledgerhq/device-management-kit";
import type { WsServerMessage } from "@ledgerhq/live-dmk-ws-proxy-shared";

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readonly url: string;
  readyState = FakeWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  sentPayloads: string[] = [];
  closeCallCount = 0;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sentPayloads.push(data);
  }

  close(): void {
    this.closeCallCount += 1;
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code: 1000 } as CloseEvent);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.({} as Event);
  }

  emitMessage(data: string): void {
    this.onmessage?.({ data } as MessageEvent);
  }

  emitError(): void {
    this.onerror?.({} as Event);
  }

  emitClose(code = 1000): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code } as CloseEvent);
  }
}

const createTransportArgs = (): TransportArgs => {
  const logger = {
    subscribers: [],
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  return {
    deviceModelDataSource: {
      getDeviceModel: jest.fn(({ id }: { id: string }) => ({
        id,
        productName: `Ledger ${id}`,
      })),
    },
    loggerServiceFactory: jest.fn(() => logger),
  } as unknown as TransportArgs;
};

const emitServerMessage = (socket: FakeWebSocket, msg: WsServerMessage): void => {
  socket.emitMessage(JSON.stringify(msg));
};

const latestClientMessage = (socket: FakeWebSocket): Record<string, unknown> => {
  const payload = socket.sentPayloads[socket.sentPayloads.length - 1];
  if (!payload) {
    throw new Error("No message sent by socket");
  }

  return JSON.parse(payload) as Record<string, unknown>;
};

describe("WsProxyTransport", () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    Object.defineProperty(globalThis, "WebSocket", {
      value: FakeWebSocket,
      configurable: true,
      writable: true,
    });
    jest.resetModules();
  });

  afterAll(() => {
    Object.defineProperty(globalThis, "WebSocket", {
      value: originalWebSocket,
      configurable: true,
      writable: true,
    });
  });

  const loadTransportModule = async () =>
    import("./WsProxyTransport") as Promise<typeof import("./WsProxyTransport")>;

  it("switches URL by closing previous socket and opening a new one", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl } = await loadTransportModule();
    const transport = wsProxyTransportFactory(createTransportArgs());

    setWsProxyUrl("ws://proxy-one");
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();

    setWsProxyUrl("ws://proxy-two");
    const secondSocket = FakeWebSocket.instances[1];

    expect(transport.getIdentifier()).toBe("WS-PROXY");
    expect(firstSocket.closeCallCount).toBe(1);
    expect(secondSocket.url).toBe("ws://proxy-two");
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it("does not auto reconnect after unexpected socket close", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl } = await loadTransportModule();
    wsProxyTransportFactory(createTransportArgs());

    setWsProxyUrl("ws://proxy-reconnect");
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();

    firstSocket.emitClose(1006);
    await Promise.resolve();

    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("reconnects on listenToAvailableDevices when socket is closed", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl } = await loadTransportModule();
    const transport = wsProxyTransportFactory(createTransportArgs());

    setWsProxyUrl("ws://proxy-reconnect-on-listen");
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();
    firstSocket.emitClose(1006);
    expect(FakeWebSocket.instances).toHaveLength(1);

    const subscription = transport.listenToAvailableDevices().subscribe();
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(FakeWebSocket.instances[1].url).toBe("ws://proxy-reconnect-on-listen");

    // Calling listen again while reconnecting should not create extra sockets.
    const secondSubscription = transport.listenToAvailableDevices().subscribe();
    expect(FakeWebSocket.instances).toHaveLength(2);

    secondSubscription.unsubscribe();
    subscription.unsubscribe();
  });

  it("propagates discovered devices from websocket messages", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl, WS_PROXY_IDENTIFIER } =
      await loadTransportModule();
    const transport = wsProxyTransportFactory(createTransportArgs());

    const emitted: unknown[] = [];
    const subscription = transport
      .listenToAvailableDevices()
      .subscribe(devices => emitted.push(devices));

    setWsProxyUrl("ws://proxy-devices");
    const socket = FakeWebSocket.instances[0];
    socket.open();
    emitServerMessage(socket, {
      type: "discovered-devices-updated",
      discoveredDevices: [
        {
          id: "device-1",
          deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
        },
      ],
    });

    const latestDevices = emitted[emitted.length - 1] as Array<Record<string, unknown>>;
    expect(latestDevices).toHaveLength(1);
    expect(latestDevices[0]).toMatchObject({
      id: "device-1",
      transport: WS_PROXY_IDENTIFIER,
      name: "Ledger Nano X",
    });
    subscription.unsubscribe();
  });

  it("handles connect, send-apdu and disconnect happy path", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl } = await loadTransportModule();
    const transport = wsProxyTransportFactory(createTransportArgs());

    setWsProxyUrl("ws://proxy-happy-path");
    const socket = FakeWebSocket.instances[0];
    socket.open();
    emitServerMessage(socket, {
      type: "discovered-devices-updated",
      discoveredDevices: [
        {
          id: "device-1",
          deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
        },
      ],
    });

    const connectPromise = transport.connect({
      deviceId: "device-1",
      onDisconnect: jest.fn(),
    });
    const connectRequest = latestClientMessage(socket);
    expect(connectRequest).toMatchObject({
      type: "connect",
      deviceId: "device-1",
    });
    emitServerMessage(socket, {
      type: "device-connected",
      requestId: connectRequest.requestId as string,
      deviceId: "device-1",
      sessionId: "session-1",
      deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
    });

    const connectResult = await connectPromise;
    expect(connectResult.isRight()).toBe(true);
    const connectedDevice = connectResult.unsafeCoerce();

    const sendApduPromise = connectedDevice.sendApdu(
      new Uint8Array([0xe0, 0x01, 0x00, 0x00]),
      false,
      4321,
    );
    const sendApduRequest = latestClientMessage(socket);
    expect(sendApduRequest).toMatchObject({
      type: "send-apdu",
      deviceId: "device-1",
      data: "e0010000",
      abortTimeoutMs: 4321,
    });
    emitServerMessage(socket, {
      type: "apdu-response",
      requestId: sendApduRequest.requestId as string,
      deviceId: "device-1",
      data: "9000",
    });

    const sendApduResult = await sendApduPromise;
    expect(sendApduResult.isRight()).toBe(true);
    expect(sendApduResult.unsafeCoerce().statusCode).toEqual(new Uint8Array([0x90, 0x00]));

    const disconnectResult = await transport.disconnect({
      connectedDevice: connectedDevice as TransportConnectedDevice,
    });
    expect(disconnectResult.isRight()).toBe(true);
    expect(latestClientMessage(socket)).toMatchObject({
      type: "disconnect",
      deviceId: "device-1",
    });
  });

  it("clears pending connect request when websocket send throws", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl } = await loadTransportModule();
    const transport = wsProxyTransportFactory(createTransportArgs());

    setWsProxyUrl("ws://proxy-connect-send-throws");
    const socket = FakeWebSocket.instances[0];
    socket.open();
    emitServerMessage(socket, {
      type: "discovered-devices-updated",
      discoveredDevices: [
        {
          id: "device-1",
          deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
        },
      ],
    });

    const sendSpy = jest.spyOn(socket, "send");
    sendSpy.mockImplementationOnce(() => {
      throw new Error("socket send failed");
    });

    const failedConnectResult = await transport.connect({
      deviceId: "device-1",
      onDisconnect: jest.fn(),
    });
    expect(failedConnectResult.isLeft()).toBe(true);

    const secondConnectPromise = transport.connect({
      deviceId: "device-1",
      onDisconnect: jest.fn(),
    });
    const secondConnectRequest = latestClientMessage(socket);
    expect(secondConnectRequest).toMatchObject({
      type: "connect",
      deviceId: "device-1",
    });
    emitServerMessage(socket, {
      type: "device-connected",
      requestId: secondConnectRequest.requestId as string,
      deviceId: "device-1",
      sessionId: "session-1",
      deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
    });

    const secondConnectResult = await secondConnectPromise;
    expect(secondConnectResult.isRight()).toBe(true);
    sendSpy.mockRestore();
  });

  it("serializes concurrent APDU requests for the same device", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl } = await loadTransportModule();
    const transport = wsProxyTransportFactory(createTransportArgs());

    setWsProxyUrl("ws://proxy-serialized-apdu");
    const socket = FakeWebSocket.instances[0];
    socket.open();
    emitServerMessage(socket, {
      type: "discovered-devices-updated",
      discoveredDevices: [
        {
          id: "device-1",
          deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
        },
      ],
    });

    const connectPromise = transport.connect({
      deviceId: "device-1",
      onDisconnect: jest.fn(),
    });
    const connectRequest = latestClientMessage(socket);
    emitServerMessage(socket, {
      type: "device-connected",
      requestId: connectRequest.requestId as string,
      deviceId: "device-1",
      sessionId: "session-1",
      deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
    });
    const connectResult = await connectPromise;
    const connectedDevice = connectResult.unsafeCoerce();

    const firstApduPromise = connectedDevice.sendApdu(new Uint8Array([0xe0, 0x01]));
    const firstApduRequest = latestClientMessage(socket);
    expect(firstApduRequest).toMatchObject({
      type: "send-apdu",
      deviceId: "device-1",
      data: "e001",
    });

    const secondApduPromise = connectedDevice.sendApdu(new Uint8Array([0xe0, 0x02]));
    // second request should wait until first response is resolved
    expect(latestClientMessage(socket)).toMatchObject({
      type: "send-apdu",
      requestId: firstApduRequest.requestId,
    });

    emitServerMessage(socket, {
      type: "apdu-response",
      requestId: firstApduRequest.requestId as string,
      deviceId: "device-1",
      data: "9000",
    });
    const firstApduResult = await firstApduPromise;
    expect(firstApduResult.isRight()).toBe(true);

    const secondApduRequest = latestClientMessage(socket);
    expect(secondApduRequest).toMatchObject({
      type: "send-apdu",
      deviceId: "device-1",
      data: "e002",
    });
    expect(secondApduRequest.requestId).not.toBe(firstApduRequest.requestId);

    emitServerMessage(socket, {
      type: "apdu-response",
      requestId: secondApduRequest.requestId as string,
      deviceId: "device-1",
      data: "9000",
    });

    const secondApduResult = await secondApduPromise;
    expect(secondApduResult.isRight()).toBe(true);
  });

  it("rejects pending requests and clears discovery on socket error", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl } = await loadTransportModule();
    const transport = wsProxyTransportFactory(createTransportArgs());

    const emittedDevices: unknown[] = [];
    const subscription = transport
      .listenToAvailableDevices()
      .subscribe(devices => emittedDevices.push(devices));

    setWsProxyUrl("ws://proxy-error");
    const socket = FakeWebSocket.instances[0];
    socket.open();
    emitServerMessage(socket, {
      type: "discovered-devices-updated",
      discoveredDevices: [
        {
          id: "device-1",
          deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
        },
      ],
    });

    const connectPromise = transport.connect({
      deviceId: "device-1",
      onDisconnect: jest.fn(),
    });
    socket.emitError();

    const connectResult = await connectPromise;
    expect(connectResult.isLeft()).toBe(true);
    expect(emittedDevices[emittedDevices.length - 1]).toEqual([]);
    subscription.unsubscribe();
  });

  it("drops active connection state when socket closes", async () => {
    const { wsProxyTransportFactory, setWsProxyUrl } = await loadTransportModule();
    const transport = wsProxyTransportFactory(createTransportArgs());

    setWsProxyUrl("ws://proxy-close");
    const socket = FakeWebSocket.instances[0];
    socket.open();
    emitServerMessage(socket, {
      type: "discovered-devices-updated",
      discoveredDevices: [
        {
          id: "device-1",
          deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
        },
      ],
    });
    socket.emitClose(1006);

    const connectResult = await transport.connect({
      deviceId: "device-1",
      onDisconnect: jest.fn(),
    });

    expect(connectResult.isLeft()).toBe(true);
  });
});
