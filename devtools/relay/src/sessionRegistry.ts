import type { DeviceDescriptor, Identity, Role } from "@devtools/transport";

/**
 * Minimal socket surface the registry needs. It never reads or writes a socket —
 * it only closes one when evicted — so the registry stays decoupled from `ws` and
 * is unit-testable with plain fakes.
 */
export interface RelaySocket {
  close(): void;
}

/** Outcome of {@link SessionRegistry.attach}, for the caller to log. */
export type AttachResult =
  | { status: "sessionless" }
  | { status: "filed"; role: Role; paired: boolean; descriptor?: DeviceDescriptor };

/** Outcome of {@link SessionRegistry.detach}; `undefined` when the socket was never filed. */
export type DetachResult = { role: Role; descriptor?: DeviceDescriptor } | undefined;

export interface SessionRegistry<S extends RelaySocket> {
  /** File a socket into its session. Tools accumulate in a Set; a host takes a single slot. All participants are paired once a host and at least one tool are present. */
  attach(identity: Identity, socket: S): AttachResult;
  /** Remove a socket, unpair its peers, and drop the session once empty. */
  detach(socket: S): DetachResult;
  /** The sockets currently paired with this one, if any. */
  peersOf(socket: S): Set<S> | undefined;
}

/**
 * Pairing broker, extracted from the relay's socket wiring.
 *
 * Each connecting host is assigned a monotonic uid as its session key; tools target
 * by that uid. A session holds one `host` and any number of `tool` sockets. Once both
 * are present, all participants are paired: each holds a Set of its peers so messages
 * can be fanned out without role look-ups. A tool without a target, or targeting an
 * unknown uid, is left connected but unfiled (`sessionless`).
 */
export function createSessionRegistry<S extends RelaySocket>(): SessionRegistry<S> {
  type Session = { host?: S; tool?: Set<S> };

  const sessions = new Map<string, Session>(); // uid -> session
  const peers = new WeakMap<S, Set<S>>();
  const filed = new WeakMap<S, { role: Role; uid: string; descriptor?: DeviceDescriptor }>();
  let counter = 0;

  function sessionFor(uid: string): Session {
    let session = sessions.get(uid);
    if (!session) {
      session = {};
      sessions.set(uid, session);
    }
    return session;
  }

  function pair(session: Session) {
    const host = session.host;
    const tools = session.tool;
    if (host && tools) {
      peers.set(host, new Set<S>(tools));
      tools.forEach((tool: S) => {
        const peerSet = new Set<S>([...tools, host]);
        peerSet.delete(tool);
        peers.set(tool, peerSet);
      });
    }
  }

  function unpair(socket: S) {
    const peer = peers.get(socket);
    if (peer) {
      for (const s of peer) peers.get(s)?.delete(socket);
    }
    peers.delete(socket);
  }

  function attach(identity: Identity, socket: S): AttachResult {
    if (identity.role === "tool" && !identity.target) return { status: "sessionless" };

    let uid: string;
    let descriptor: DeviceDescriptor | undefined;

    if (identity.role === "host") {
      uid = String(++counter);
      descriptor = { uid, platform: identity.platform, version: identity.version };
    } else {
      uid = identity.target!;
      descriptor = { uid, platform: identity.platform, version: identity.version };
      if (!sessions.has(uid)) return { status: "sessionless" };
    }

    const role = identity.role;
    const session = sessionFor(uid);

    if (role === "tool") {
      if (!session.tool) session.tool = new Set();
      session.tool.add(socket);
    } else {
      session.host = socket;
    }
    filed.set(socket, { role, uid, descriptor });
    pair(session);

    return {
      status: "filed",
      role,
      paired: Boolean(session.host && session.tool),
      descriptor,
    };
  }

  function detach(socket: S): DetachResult {
    unpair(socket);

    const entry = filed.get(socket);
    if (!entry) return undefined;
    filed.delete(socket);

    const session = sessions.get(entry.uid);
    if (session) {
      if (entry.role === "tool") session.tool?.delete(socket);
      else if (entry.role === "host") session.host = undefined;
      if (!session.host && (!session.tool || session.tool.size === 0))
        sessions.delete(entry.uid);
    }
    return { role: entry.role, descriptor: entry.descriptor };
  }

  function peersOf(socket: S): Set<S> | undefined {
    const set = peers.get(socket);
    return set?.size ? set : undefined;
  }

  return { attach, detach, peersOf };
}
