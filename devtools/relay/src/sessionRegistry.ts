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
  | {
      status: "filed";
      role: Role;
      evicted: boolean;
      paired: boolean;
      descriptor?: DeviceDescriptor;
    };

/** Outcome of {@link SessionRegistry.detach}; `undefined` when the socket was never filed. */
export type DetachResult = { role: Role; descriptor?: DeviceDescriptor } | undefined;

export interface SessionRegistry<S extends RelaySocket> {
  /** File a socket into its session role slot, evicting the previous occupant and pairing once both roles are filled. */
  attach(identity: Identity, socket: S): AttachResult;
  /** Remove a socket, unpair its peer, and drop the session once empty. */
  detach(socket: S): DetachResult;
  /** The socket currently paired with this one, if any. */
  peerOf(socket: S): S | undefined;
}

/**
 * Pairing broker, extracted from the relay's socket wiring.
 *
 * Each session owns two roles — one `host`, one `tool`. Filling both roles pairs
 * the sockets (each gets a direct reference to the other). A newcomer evicts the
 * previous occupant of its role slot. A tool without a target has no host to reach,
 * so it is left connected but unfiled (`sessionless`).
 *
 * The relay assigns a monotonic `uid` to each connecting host; this uid becomes the
 * session key and is what tools use as their `target`.
 */
export function createSessionRegistry<S extends RelaySocket>(): SessionRegistry<S> {
  type Session = { host?: S; tool?: S };

  const sessions = new Map<string, Session>(); // uid -> its two roles
  const peers = new WeakMap<S, S>(); // socket -> the socket it's paired with
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
    if (session.host && session.tool) {
      peers.set(session.host, session.tool);
      peers.set(session.tool, session.host);
    }
  }

  function unpair(socket: S) {
    const peer = peers.get(socket);
    if (peer) peers.delete(peer);
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

    const previous = session[role];
    const evicted = Boolean(previous && previous !== socket);
    if (previous && previous !== socket) {
      unpair(previous);
      previous.close();
    }

    session[role] = socket;
    filed.set(socket, { role, uid, descriptor });
    pair(session);

    return {
      status: "filed",
      role,
      evicted,
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
      if (session[entry.role] === socket) session[entry.role] = undefined;
      if (!session.host && !session.tool) sessions.delete(entry.uid);
    }
    return { role: entry.role, descriptor: entry.descriptor };
  }

  function peerOf(socket: S): S | undefined {
    return peers.get(socket);
  }

  return { attach, detach, peerOf };
}
