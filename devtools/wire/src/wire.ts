import { createTransport, identityUrl } from "@devtools/transport";
import type {
  MessageMap,
  Role,
  Transport,
  TransportProtocol,
  WebSocketLike,
} from "@devtools/transport";

export type WireTransportOptions = {
  hubUrl: string;
  role: Role;
  id: string;
  target?: string;
  socketFactory?: (url: string, protocols?: string | string[]) => WebSocketLike;
};

export type WireState = {
  hubUrl: string;
  role: Role;
  target: string | undefined;
};

export type Wire<M extends MessageMap> = {
  transport: Transport<M>;
  getState(): WireState;
  subscribe(listener: () => void): () => void;
  setTarget(target: string | undefined): void;
  setHubUrl(hubUrl: string): void;
};

export function isValidWsUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    if (protocol !== "ws:" && protocol !== "wss:") return false;
    const rawHostname = /^wss?:\/\/([^/:?#]*)/.exec(url)?.[1] ?? "";
    if (rawHostname.length === 0) return false;
    if (/^[\d.]+$/.test(rawHostname)) {
      const parts = rawHostname.split(".");
      return parts.length === 4 && parts.every(p => p.length > 0 && Number(p) <= 255);
    }
    return true;
  } catch {
    return false;
  }
}

export function buildTargetUrl(options: WireTransportOptions): string {
  return identityUrl(options.hubUrl, {
    role: options.role,
    id: options.id,
    target: options.target,
  });
}

export function isMatch<M extends object>(origin: M, partial: Partial<M>): boolean {
  return (Object.keys(partial) as (keyof M)[]).every(k => Object.is(origin[k], partial[k]));
}

export function buildTransport<M extends MessageMap>(
  options: WireTransportOptions,
  protocol: TransportProtocol<M>,
): Wire<M> {
  const config = { ...options };
  const transport = createTransport(
    { url: buildTargetUrl(config), origin: config.id, socketFactory: config.socketFactory },
    protocol,
  );
  if (isValidWsUrl(config.hubUrl)) {
    transport.connect();
  }

  let state: WireState = { hubUrl: config.hubUrl, role: config.role, target: config.target };
  const listeners = new Set<() => void>();

  function update(patch: Partial<WireState>) {
    if (isMatch(state, patch)) return;
    Object.assign(config, patch);
    state = { ...state, ...patch };
    listeners.forEach(l => l());
    if (isValidWsUrl(config.hubUrl)) {
      transport.setUrl(buildTargetUrl(config));
    }
  }

  return {
    transport,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTarget: target => update({ target }),
    setHubUrl: hubUrl => update({ hubUrl }),
  };
}
