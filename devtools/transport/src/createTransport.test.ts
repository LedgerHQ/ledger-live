import { createTransport } from "./createTransport";
import type { TransportConfig, TransportProtocol, WebSocketLike } from "./types";

type TestMap = { ping: string; pong: number };

function makeMockSocket() {
  const socket: WebSocketLike = {
    send: jest.fn(),
    close: jest.fn(),
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
  };
  return {
    socket,
    open: () => socket.onopen?.({}),
    message: (data: unknown) => socket.onmessage?.({ data: JSON.stringify(data) }),
    error: () => socket.onerror?.({}),
    close: () => socket.onclose?.({}),
  };
}

function makeTransport(
  overrides?: Partial<TransportConfig>,
  protocol?: Partial<TransportProtocol<TestMap>>,
) {
  const mock = makeMockSocket();
  const factory = jest.fn(() => mock.socket);
  const config: TransportConfig = {
    url: "ws://localhost",
    origin: "test-origin",
    socketFactory: factory,
    ...overrides,
  };
  const proto: TransportProtocol<TestMap> = {
    onReceive: jest.fn(),
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onError: jest.fn(),
    ...protocol,
  };
  const transport = createTransport<TestMap>(config, proto);
  return { transport, mock, factory, proto };
}

describe("createTransport — status transitions", () => {
  it("should start in idle", () => {
    const { transport } = makeTransport();
    expect(transport.getState().status).toBe("idle");
  });

  it("should move to connecting when connect() is called", () => {
    const { transport } = makeTransport();
    transport.connect();
    expect(transport.getState().status).toBe("connecting");
  });

  it("should move to open when the socket fires onopen", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    expect(transport.getState().status).toBe("open");
  });

  it("should move to closed when the socket fires onclose", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    mock.close();
    expect(transport.getState().status).toBe("closed");
  });

  it("should move to error when the socket fires onerror", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.error();
    expect(transport.getState().status).toBe("error");
  });

  it("should set lastError on socket error", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.error();
    expect(transport.getState().lastError).toBeInstanceOf(Error);
  });

  it("should move to closed when disconnect() is called", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    transport.disconnect();
    expect(transport.getState().status).toBe("closed");
  });

  it("should call socket.close() on disconnect()", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    transport.disconnect();
    expect(mock.socket.close).toHaveBeenCalledTimes(1);
  });
});

describe("createTransport — connect() guard", () => {
  it("should be a no-op when called while already connected", () => {
    const { transport, factory } = makeTransport();
    transport.connect();
    transport.connect();
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe("createTransport — send()", () => {
  it("should return an envelope with the correct kind and payload", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    const env = transport.send("ping", "hello");
    expect(env.kind).toBe("ping");
    expect(env.payload).toBe("hello");
  });

  it("should stamp origin from config", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    const env = transport.send("ping", "hello");
    expect(env.origin).toBe("test-origin");
  });

  it("should increment seq monotonically", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    const first = transport.send("ping", "a");
    const second = transport.send("ping", "b");
    expect(second.seq).toBe(first.seq + 1);
  });

  it("should call socket.send with JSON-encoded envelope", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    const env = transport.send("ping", "hello");
    expect(mock.socket.send).toHaveBeenCalledWith(JSON.stringify(env));
  });

  it("should throw an error when sending while disconnected", () => {
    const { transport } = makeTransport();
    transport.connect();
    transport.disconnect();
    expect(() => transport.send("ping", "hello")).toThrow("transport is not open");
  });
});

describe("createTransport — history", () => {
  it("should record sent envelopes in order", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    transport.send("ping", "first");
    transport.send("ping", "second");
    const { history } = transport.getState();
    expect(history[0].payload).toBe("first");
    expect(history[1].payload).toBe("second");
  });

  it("should record received messages in history", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    mock.open();
    mock.message({ id: "x", seq: 0, ts: 0, origin: "remote", kind: "pong", payload: 42 });
    const { history } = transport.getState();
    expect(history[0]).toMatchObject({ kind: "pong", payload: 42 });
  });

  it("should evict the oldest entry when historyLimit is exceeded", () => {
    const { transport, mock } = makeTransport({ historyLimit: 2 });
    transport.connect();
    mock.open();
    transport.send("ping", "a");
    transport.send("ping", "b");
    transport.send("ping", "c");
    const { history } = transport.getState();
    expect(history).toHaveLength(2);
    expect(history[0].payload).toBe("b");
    expect(history[1].payload).toBe("c");
  });
});

describe("createTransport — subscribe()", () => {
  it("should call listener on status change", () => {
    const { transport } = makeTransport();
    const listener = jest.fn();
    transport.subscribe(listener);
    transport.connect();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should stop calling listener after unsubscribe", () => {
    const { transport } = makeTransport();
    const listener = jest.fn();
    const unsub = transport.subscribe(listener);
    unsub();
    transport.connect();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("createTransport — getState()", () => {
  it("should return the same reference between state changes", () => {
    const { transport } = makeTransport();
    const a = transport.getState();
    const b = transport.getState();
    expect(a).toBe(b);
  });

  it("should return a new reference after a state change", () => {
    const { transport } = makeTransport();
    const before = transport.getState();
    transport.connect();
    const after = transport.getState();
    expect(before).not.toBe(after);
  });
});

describe("createTransport — setUrl()", () => {
  it("should reconnect with the new URL", () => {
    const { transport, factory } = makeTransport();
    transport.connect();
    transport.setUrl("ws://newhost");
    expect(factory).toHaveBeenCalledTimes(2);
    expect(factory).toHaveBeenNthCalledWith(2, "ws://newhost", undefined);
  });

  it("should close the old socket before reconnecting", () => {
    const { transport, mock } = makeTransport();
    transport.connect();
    transport.setUrl("ws://newhost");
    expect(mock.socket.close).toHaveBeenCalledTimes(1);
  });

  it("should reflect the new URL in state", () => {
    const { transport } = makeTransport();
    transport.setUrl("ws://newhost");
    expect(transport.getState().url).toBe("ws://newhost");
  });
});

describe("createTransport — protocol callbacks", () => {
  it("should call onOpen with the transport handle when socket opens", () => {
    const { transport, mock, proto } = makeTransport();
    transport.connect();
    mock.open();
    expect(proto.onOpen).toHaveBeenCalledWith(transport);
  });

  it("should call onReceive with kind and payload on incoming message", () => {
    const { transport, mock, proto } = makeTransport();
    transport.connect();
    mock.open();
    mock.message({ id: "x", seq: 0, ts: 0, origin: "remote", kind: "pong", payload: 7 });
    expect(proto.onReceive).toHaveBeenCalledWith(
      "pong",
      7,
      expect.objectContaining({ kind: "pong", payload: 7 }),
    );
  });

  it("should call onError on socket error", () => {
    const { transport, mock, proto } = makeTransport();
    transport.connect();
    mock.error();
    expect(proto.onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should call onClose when socket closes", () => {
    const { transport, mock, proto } = makeTransport();
    transport.connect();
    mock.open();
    mock.close();
    expect(proto.onClose).toHaveBeenCalledTimes(1);
  });

  it("should ignore stale socket events after disconnect", () => {
    const { transport, mock, proto } = makeTransport();
    transport.connect();
    mock.open();
    transport.disconnect();
    mock.close();
    expect(proto.onClose).toHaveBeenCalledTimes(1);
  });
});
