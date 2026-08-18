import type { Transport } from "@devtools/transport";
import { replaceStoreAction, type CopyStoreMessages } from "@devtools/protocols/copyStore";
import { buildCopyStoreProtocol } from "./copyStore";

function makeStore(initialState: unknown = {}) {
  const state = initialState;
  return {
    dispatch: jest.fn(),
    getState: jest.fn(() => state),
  };
}

function makeListener() {
  return {
    startListening: jest.fn(() => jest.fn()),
  };
}

function makeTransport() {
  return { send: jest.fn() } as unknown as Transport<CopyStoreMessages>;
}

const env = {} as never;

describe("buildCopyStoreProtocol — setStoreState wiring", () => {
  it("should dispatch replaceStoreAction when a snapshot is received as tool", () => {
    const store = makeStore();
    const protocol = buildCopyStoreProtocol(store, makeListener(), "tool");
    const transport = makeTransport();

    protocol.onOpen?.(transport);
    protocol.onReceive("snapshot", { count: 5 }, env);

    expect(store.dispatch).toHaveBeenCalledWith(replaceStoreAction({ count: 5 }));
  });
});

describe("buildCopyStoreProtocol — getSnapshot wiring", () => {
  it("should read from store.getState() when sending the snapshot on open", () => {
    const store = makeStore({ value: 42 });
    const protocol = buildCopyStoreProtocol(store, makeListener(), "host");
    const transport = makeTransport();

    protocol.onOpen?.(transport);

    expect(store.getState).toHaveBeenCalled();
    expect(transport.send).toHaveBeenCalledWith("snapshot", { value: 42 });
  });
});

describe("buildCopyStoreProtocol — dispatch wiring", () => {
  it("should call store.dispatch when a remote action is received", () => {
    const store = makeStore();
    const protocol = buildCopyStoreProtocol(store, makeListener(), "host");
    const transport = makeTransport();

    protocol.onOpen?.(transport);
    store.dispatch.mockClear();

    protocol.onReceive("action", { type: "remote/inc" }, env);

    expect(store.dispatch).toHaveBeenCalledWith({ type: "remote/inc" });
  });
});

describe("buildCopyStoreProtocol — role wiring", () => {
  it("should send snapshot on open when role is host", () => {
    const store = makeStore({ x: 1 });
    const protocol = buildCopyStoreProtocol(store, makeListener(), "host");
    const transport = makeTransport();

    protocol.onOpen?.(transport);

    expect(transport.send).toHaveBeenCalledWith("snapshot", { x: 1 });
  });

  it("should request snapshot on open when role is tool", () => {
    const store = makeStore();
    const protocol = buildCopyStoreProtocol(store, makeListener(), "tool");
    const transport = makeTransport();

    protocol.onOpen?.(transport);

    expect(transport.send).toHaveBeenCalledWith("requestSnapshot", null);
  });
});
