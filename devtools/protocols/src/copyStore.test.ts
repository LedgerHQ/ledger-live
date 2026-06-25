import type { Transport } from "@devtools/transport";
import { createMockStore } from "../jest/mockStore";
import {
  COPY_STORE_REPLACE,
  createCopyStoreProtocol,
  replaceStoreAction,
  withCopyStoreHydration,
} from "./copyStore";
import type { CopyStoreMessages } from "./copyStore";

describe("replaceStoreAction", () => {
  it("should wrap a snapshot as a replace action", () => {
    expect(replaceStoreAction({ a: 1 })).toEqual({
      type: COPY_STORE_REPLACE,
      payload: { a: 1 },
    });
  });
});

describe("withCopyStoreHydration", () => {
  const counter = (state: number | undefined = 0, action: { type: string }) =>
    action.type === "increment" ? state + 1 : state;

  it("should replace the state with the snapshot on a replace action", () => {
    const reducer = withCopyStoreHydration(counter);
    expect(reducer(0, replaceStoreAction(42) as { type: string })).toBe(42);
  });

  it("should pass non-replace actions through the wrapped reducer", () => {
    const reducer = withCopyStoreHydration(counter);
    expect(reducer(7, { type: "increment" })).toBe(8);
  });

  it("should keep the current state on a malformed replace with no payload", () => {
    const reducer = withCopyStoreHydration(counter);
    expect(reducer(9, { type: COPY_STORE_REPLACE })).toBe(9);
  });
});

describe("createCopyStoreProtocol", () => {
  function setup(role: "host" | "tool") {
    const store = createMockStore({ count: 1 });
    const send = jest.fn();
    const transport = { send } as unknown as Transport<CopyStoreMessages>;

    const protocol = createCopyStoreProtocol({
      role,
      dispatch: store.dispatch,
      setStoreState: store.setStoreState,
      getSnapshot: store.getSnapshot,
      listener: store.listener,
    });

    return { protocol, transport, send, store };
  }

  const env = {} as never;

  it("should push a snapshot on open when host", () => {
    const { protocol, transport, send } = setup("host");
    protocol.onOpen?.(transport);
    expect(send).toHaveBeenCalledWith("snapshot", { count: 1 });
  });

  it("should request a snapshot on open when tool", () => {
    const { protocol, transport, send } = setup("tool");
    protocol.onOpen?.(transport);
    expect(send).toHaveBeenCalledWith("requestSnapshot", null);
  });

  it("should relay a locally-dispatched action", () => {
    const { protocol, transport, send, store } = setup("host");
    protocol.onOpen?.(transport);

    store.dispatch({ type: "local/action" });

    expect(send).toHaveBeenCalledWith("action", { type: "local/action" });
  });

  it("should dispatch a received action into the local store", () => {
    const { protocol, transport, store } = setup("host");
    protocol.onOpen?.(transport);

    protocol.onReceive("action", { type: "remote/action" }, env);

    expect(store.getState().lastAction).toBe("remote/action");
  });

  it("should not relay a received action back to the peer", () => {
    const { protocol, transport, send } = setup("host");
    protocol.onOpen?.(transport);
    send.mockClear();

    protocol.onReceive("action", { type: "remote/action" }, env);

    expect(send).not.toHaveBeenCalled();
  });

  it("should relay again after a received action has been applied", () => {
    const { protocol, transport, send, store } = setup("host");
    protocol.onOpen?.(transport);

    protocol.onReceive("action", { type: "remote/action" }, env);
    store.dispatch({ type: "local/action" });

    expect(send).toHaveBeenCalledWith("action", { type: "local/action" });
  });

  it("should hydrate the local store from a received snapshot", () => {
    const { protocol, transport, store } = setup("tool");
    protocol.onOpen?.(transport);

    protocol.onReceive("snapshot", { count: 5 }, env);

    expect(store.getState()).toEqual({ count: 5 });
  });

  it("should answer a snapshot request with the current snapshot", () => {
    const { protocol, transport, send } = setup("host");
    protocol.onOpen?.(transport);
    send.mockClear();

    protocol.onReceive("requestSnapshot", null, env);

    expect(send).toHaveBeenCalledWith("snapshot", { count: 1 });
  });

  it("should stop relaying after close", () => {
    const { protocol, transport, send, store } = setup("host");
    protocol.onOpen?.(transport);
    protocol.onClose?.();
    send.mockClear();

    store.dispatch({ type: "local/action" });

    expect(send).not.toHaveBeenCalled();
  });
});
