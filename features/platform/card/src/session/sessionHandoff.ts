import type { CardAuthorizationGrant, CardSessionCredentials } from "@shared/api-services";

/**
 * The two credentials that must never travel through redux.
 *
 * RTK Query dispatches an action for every phase of a request: `meta.arg.originalArgs` on the
 * pending one, and the answer on the fulfilled one. The desktop redux logger writes both into the
 * file users attach to a support ticket, in production, and the mobile DevTools relay sends both
 * over a socket. So the two OAuth2 grants pass their credentials here instead:
 *
 * - the login flow puts the authorization grant in, and the endpoint takes it out;
 * - the endpoint puts the new session in, and the caller takes it out with the handle the endpoint
 *   answered with.
 *
 * Module state, like the session store itself: one process holds one Card session.
 */

/** The grant waiting for the next code exchange. One at a time: a login is one journey. */
let pendingGrant: CardAuthorizationGrant | null = null;

/**
 * Sessions a grant has handed over and nobody has read yet. Normally empty, or of size one. The cap
 * bounds it if a caller drops a receipt: an unread session is a credential that nobody can use.
 */
const MAX_UNREAD_SESSIONS = 4;
const unreadSessions = new Map<string, CardSessionCredentials>();

let handleCounter = 0;

/** Called by the login flow immediately before it dispatches the code exchange. */
export function putCardAuthorizationGrant(grant: CardAuthorizationGrant): void {
  pendingGrant = grant;
}

/** Called by the code exchange. A grant is used once, so this call also empties the slot. */
export function takeCardAuthorizationGrant(): CardAuthorizationGrant | null {
  const grant = pendingGrant;
  pendingGrant = null;
  return grant;
}

export function forgetCardAuthorizationGrant(): void {
  pendingGrant = null;
}

/** Called by either grant. Answers with the handle the endpoint returns in its place. */
export function receiveCardSession(session: CardSessionCredentials): string {
  if (unreadSessions.size >= MAX_UNREAD_SESSIONS) {
    const oldest = unreadSessions.keys().next().value;
    if (oldest !== undefined) {
      unreadSessions.delete(oldest);
    }
  }

  handleCounter += 1;
  const handle = `card-session-${handleCounter}`;
  unreadSessions.set(handle, session);
  return handle;
}

/** Called by whoever dispatched the grant, with the handle from its receipt. Reads once. */
export function takeCardSession(handle: string): CardSessionCredentials | null {
  const session = unreadSessions.get(handle) ?? null;
  unreadSessions.delete(handle);
  return session;
}

export function forgetReceivedCardSessions(): void {
  unreadSessions.clear();
}
