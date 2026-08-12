import type { Role, Transport, TransportProtocol } from "@devtools/transport";

/**
 * copy-store protocol — mirror a Redux store across the wire.
 *
 * The two ends run the same loop: every action dispatched locally is relayed to
 * the peer (the protocol drives the app's RTK listener middleware), and every action
 * received from the peer is `dispatch`ed into the local store. Both stores stay in
 * lock-step; the protocol suppresses relay while applying peer actions, so no echo.
 * A full snapshot, exchanged once at connect, is applied through `setStoreState`.
 *
 * Role only matters at connect time, in `onOpen`:
 *   - **host** pushes its current snapshot, so a tool already connected hydrates;
 *   - **tool** requests a snapshot, so it hydrates even if it connects after the host.
 *
 * Running both covers either join order. `onReceive` is identical on both sides.
 *
 * Build it with {@link createCopyStoreProtocol} and pass the result to
 * `createTransport<CopyStoreMessages>(config, protocol)`.
 */
export type CopyStoreMessages = {
  /** A Redux action relayed to the peer, dispatched on the other side. */
  action: unknown;
  /** Full store snapshot, used for initial hydration. */
  snapshot: unknown;
  /** A peer asking for the current snapshot. No payload. */
  requestSnapshot: null;
};

export const COPY_STORE_PROTOCOL_ID = "copy-store";

/** Convenience action type for a `setStoreState` impl that replaces state via a root reducer handling it. */
export const COPY_STORE_REPLACE = "@devtools/copy-store/replace" as const;

/** Convenience: wrap a snapshot as the replace-state action a `setStoreState` impl can dispatch. */
export const replaceStoreAction = (snapshot: unknown) => ({
  type: COPY_STORE_REPLACE,
  payload: snapshot,
});

/**
 * Wrap a root reducer so it hydrates on {@link replaceStoreAction}.
 *
 * On a {@link COPY_STORE_REPLACE} action carrying a `payload`, it feeds that snapshot
 * back through the wrapped reducer as the next state
 *
 * @example
 * configureStore({ reducer: withCopyStoreHydration(combineReducers({ featureFlags })) })
 */
export function withCopyStoreHydration<S, A extends { type: string }>(
  reducer: (state: S | undefined, action: A) => S,
): (state: S | undefined, action: A) => S {
  return (state, action) => {
    if (action.type !== COPY_STORE_REPLACE) return reducer(state, action);

    if (!("payload" in action)) return reducer(state, action);

    const { payload } = action as { payload?: unknown };
    if (payload === undefined) return reducer(state, action);
    return reducer(payload as S, action);
  };
}

/**
 * The slice of an RTK listener-middleware instance the protocol drives.
 *
 * The app creates the instance with `createListenerMiddleware()`, registers its
 * `.middleware` in the store, and hands the bare instance over — no `startListening`
 * call of its own. The protocol owns the listener's behaviour: it starts listening
 * in `onOpen` (relaying every locally-dispatched action) and tears it down in
 * `onClose` via the returned unsubscribe.
 *
 * Structural on purpose: this is exactly the surface RTK's `ListenerMiddlewareInstance`
 * already satisfies, so the protocol stays free of a hard `@reduxjs/toolkit` dependency.
 */
export type StoreActionListener = {
  startListening(options: {
    predicate: () => boolean;
    effect: (action: unknown) => void;
  }): () => void;
};

export type CopyStoreOptions = {
  /** This end's role; only changes `onOpen` behaviour. */
  role: Role;
  /** Dispatch into the local store, raw. The protocol guards against the echo loop itself. */
  dispatch: (action: unknown) => void;
  /**
   * Replace the local store with a received full snapshot (hydration). The app
   * owns how the replace happens — e.g. dispatch {@link replaceStoreAction} into a
   * root reducer that handles {@link COPY_STORE_REPLACE}, or scope it to mirrored slices.
   */
  setStoreState: (snapshot: unknown) => void;
  /** Read the current full store state, sent on a snapshot push or request. */
  getSnapshot: () => unknown;
  /**
   * The app's empty RTK listener-middleware instance. The protocol drives it:
   * relays each locally-dispatched action on connect, suppresses relay while
   * applying peer-originated actions (no echo loop), and stops on disconnect.
   */
  listener: StoreActionListener;
};

/**
 * Build the copy-store {@link TransportProtocol}.
 *
 * @param options - see {@link CopyStoreOptions}; the only role-specific behaviour is the open-time handshake.
 */
export function createCopyStoreProtocol(
  options: CopyStoreOptions,
): TransportProtocol<CopyStoreMessages> {
  const { role, dispatch, setStoreState, getSnapshot, listener } = options;
  let transport: Transport<CopyStoreMessages> | undefined;
  let unsubscribe: (() => void) | undefined;

  // Set while applying a peer-originated update so the listener skips relaying it
  // back — this is what breaks the echo loop between the two mirrored stores.
  let applyingRemote = false;
  const applyRemote = (apply: () => void) => {
    applyingRemote = true;
    try {
      apply();
    } finally {
      applyingRemote = false;
    }
  };

  return {
    onOpen(t) {
      transport = t;
      if (role === "host") t.send("snapshot", getSnapshot());
      else t.send("requestSnapshot", null);
      unsubscribe = listener.startListening({
        predicate: () => !applyingRemote,
        effect: action => t.send("action", action),
      });
    },

    onReceive(kind, payload) {
      switch (kind) {
        case "action":
          applyRemote(() => dispatch(payload));
          break;
        case "snapshot":
          applyRemote(() => setStoreState(payload));
          break;
        case "requestSnapshot":
          transport?.send("snapshot", getSnapshot());
          break;
      }
    },

    onClose() {
      unsubscribe?.();
      unsubscribe = undefined;
      transport = undefined;
    },
  };
}
