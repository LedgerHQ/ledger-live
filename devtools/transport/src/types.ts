/**
 * Map of message kinds to their payload type, declared by the consumer.
 *
 * Transport is generic over this map: it gets typed `kind`s and payloads while
 * staying ignorant of what any kind means. `@devtools/protocols` (or any other
 * consumer) defines its own `MessageMap` — e.g. `{ action: AnyAction; snapshot: RootState }`.
 */
export type MessageMap = Record<string, unknown>;

/**
 * A framed message as it travels over the socket — the transport's only I/O type.
 *
 * The consumer sends `(kind, payload)`; transport stamps `id`/`seq`/`ts`/`origin`
 * and emits a full `Envelope`. Received messages are full `Envelope`s too.
 *
 * @typeParam M - The consumer's {@link MessageMap}.
 * @typeParam K - The specific kind this envelope carries.
 */
export type Envelope<M extends MessageMap, K extends keyof M = keyof M> = {
  /** Unique per message — used for dedup. */
  id: string;
  /** Monotonic per sender — used for ordering and late-join replay. */
  seq: number;
  /** Creation time, epoch ms. */
  ts: number;
  /** Sender identity, taken from {@link TransportConfig.origin}. */
  origin: string;
  /** Typed key of the consumer's {@link MessageMap}. */
  kind: K;
  /** Payload type bound to `kind` by the {@link MessageMap}. */
  payload: M[K];
};

/**
 * Connection lifecycle state, surfaced through {@link TransportState.status}.
 */
export type ConnectionStatus = "idle" | "connecting" | "open" | "closed" | "error";

/**
 * Strategy declared by transport and implemented by the consumer.
 *
 * Transport knows nothing about Redux or any domain — it only calls these
 * methods. The implementation's bodies hold all the real logic (e.g. dispatching
 * to an RTK store). This is the dependency-inversion seam: transport depends on
 * the interface, the consumer provides the concrete impl via the constructor.
 *
 * Methods are inbound/lifecycle only. There is deliberately **no `onSend`** —
 * outbound flows the other way (the impl calls {@link Transport.send}), and any
 * "send when X changes" logic is wired by the impl inside {@link onOpen}, where
 * it receives the transport handle.
 *
 * @typeParam M - The consumer's {@link MessageMap}.
 */
export interface TransportProtocol<M extends MessageMap> {
  /** Called for every received message, narrowed by `kind`. */
  onReceive<K extends keyof M>(kind: K, payload: M[K], env: Envelope<M, K>): void;
  /** Called once the socket is open; the impl gets the handle to send or wire listeners. */
  onOpen?(transport: Transport<M>): void;
  /** Called when the socket closes. */
  onClose?(): void;
  /** Called on a connection or protocol error. */
  onError?(err: Error): void;
}

/**
 * Minimal WebSocket surface the transport relies on.
 *
 * Lets the transport stay isomorphic: the browser passes the global `WebSocket`,
 * Node passes the `ws` package — both satisfy this shape. Also the test seam.
 */
export interface WebSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
}

/**
 * Construction config for a {@link Transport}. Only `url` and `origin` are required.
 */
export type TransportConfig = {
  /** WebSocket URL to connect to. */
  url: string;
  /** Identity stamped on every outbound {@link Envelope}. */
  origin: string;
  /** Optional WebSocket subprotocols. */
  wsSubProtocols?: string | string[];
  /** History ring-buffer size; defaults to ~500. */
  historyLimit?: number;
  /**
   * Factory for the underlying socket — the isomorphism seam. Defaults to the
   * global `WebSocket` when present; Node consumers pass a `ws`-backed factory.
   */
  socketFactory?: (url: string, protocols?: string | string[]) => WebSocketLike;
};

/**
 * Reactive snapshot of a {@link Transport}, read via {@link Transport.getState}.
 *
 * Must be a cached value with a stable reference between changes so it can back
 * `useSyncExternalStore` without looping.
 *
 * @typeParam M - The consumer's {@link MessageMap}.
 */
export type TransportState<M extends MessageMap> = {
  status: ConnectionStatus;
  url: string;
  origin: string;
  history: ReadonlyArray<Envelope<M>>;
  lastError?: Error;
};

/**
 * Public instance type of the transport.
 *
 * Split by direction: imperative **writes** are methods; reactive **reads** go
 * through `getState`/`subscribe`. No `dispatch`, `store`, `role` or `snapshot`
 * here — all domain logic lives in the {@link TransportProtocol} implementation.
 *
 * @typeParam M - The consumer's {@link MessageMap}.
 */
export interface Transport<M extends MessageMap> {
  /** Open the connection. */
  connect(): void;
  /** Close the connection and stop reconnecting. */
  disconnect(): void;
  /** Frame and ship a message; returns the stamped envelope. */
  send<K extends keyof M>(kind: K, payload: M[K]): Envelope<M, K>;
  /** Change the target URL and reconnect */
  setUrl(url: string): void;
  /** Cached, stable-reference snapshot for reactive reads. */
  getState(): TransportState<M>;
  /** Subscribe to state changes; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}
