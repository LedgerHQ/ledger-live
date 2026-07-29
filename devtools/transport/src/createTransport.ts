import type {
  ConnectionStatus,
  Envelope,
  MessageMap,
  Transport,
  TransportConfig,
  TransportProtocol,
  TransportState,
  WebSocketLike,
} from "./types";

import { createSocketFactory } from "./socketFactory";

const isEnvelope = <M extends MessageMap>(value: unknown): value is Envelope<M> =>
  typeof value === "object" && value !== null && "kind" in value && "payload" in value;

export function createTransport<M extends MessageMap>(
  config: TransportConfig,
  protocol: TransportProtocol<M>,
): Transport<M> {
  const factory = config.socketFactory ?? createSocketFactory();
  const historyLimit = config.historyLimit ?? 500;

  // --- private state: the transport owns all of this ---
  let socket: WebSocketLike | null = null;
  let status: ConnectionStatus = "idle";
  let url = config.url;
  let origin = config.origin;
  let seq = 0;
  let lastError: Error | undefined;
  let history: ReadonlyArray<Envelope<M>> = [];
  const listeners = new Set<() => void>();

  function buildSnapshot(): TransportState<M> {
    return {
      status,
      url,
      origin,
      history,
      lastError,
    };
  }

  let snapshot: TransportState<M> = buildSnapshot();

  function emit() {
    snapshot = buildSnapshot();
    listeners.forEach(fn => fn());
  }

  function setStatus(next: ConnectionStatus) {
    status = next;
    emit();
  }

  function record(env: Envelope<M>) {
    if (historyLimit <= 0) return;
    history = [...history, env].slice(-historyLimit);
  }

  const transport: Transport<M> = {
    connect() {
      if (socket) return;
      lastError = undefined;
      setStatus("connecting");
      try {
        const s = factory(url, config.wsSubProtocols);
        socket = s;
        s.onopen = () => {
          if (socket !== s) return;
          setStatus("open");
          protocol.onOpen?.(transport);
        };
        s.onmessage = e => {
          if (socket !== s) return;
          try {
            const parsed = JSON.parse(String(e.data));
            if (!isEnvelope<M>(parsed)) throw new Error("websocket message has invalid shape");
            const env = parsed;
            record(env);
            emit();
            protocol.onReceive(env.kind, env.payload, env);
          } catch (err) {
            const error = new Error("websocket message parse error", { cause: err });
            lastError = error;
            socket = null;
            s.close();
            setStatus("error");
            protocol.onError?.(error);
            protocol.onClose?.();
          }
        };
        s.onerror = () => {
          if (socket !== s) return;
          socket = null;
          s.close();

          lastError = new Error("websocket error");
          setStatus("error");
          protocol.onError?.(lastError);
          protocol.onClose?.();
        };
        s.onclose = () => {
          if (socket !== s) return;
          socket = null;
          setStatus("closed");
          protocol.onClose?.();
        };
      } catch (err) {
        lastError = new Error("websocket connection error", { cause: err });
        setStatus("error");
        protocol.onError?.(lastError);
        protocol.onClose?.();
      }
    },

    disconnect() {
      const local = socket;
      socket = null;
      local?.close();
      setStatus("closed");
      protocol.onClose?.();
    },

    send<K extends keyof M>(kind: K, payload: M[K]): Envelope<M, K> {
      if (status !== "open") {
        throw new Error("transport is not open");
      }
      const date = Date.now();
      seq++;
      const env = {
        id: `${config.origin}-${date}-${seq}`,
        seq: seq,
        ts: date,
        origin: config.origin,
        kind,
        payload,
      };
      socket?.send(JSON.stringify(env));
      record(env);
      emit();
      return env;
    },

    setUrl(next: string) {
      url = next;
      transport.disconnect();
      transport.connect();
    },

    getState() {
      return snapshot;
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return transport;
}
