import type { CardAuthorizationGrant, CardSessionCredentials } from "@shared/api-services";

/**
 * The two credentials that must never travel through redux.
 *
 * RTK Query dispatches an action for every phase of a request: `meta.arg.originalArgs` on the
 * pending one, and the answer on the fulfilled one. The desktop redux logger writes both into the
 * file users attach to a support ticket, in production, and the mobile DevTools relay sends both
 * over a socket with no sanitizer hook. So the two OAuth2 grants pass their credentials here:
 *
 * - the login flow puts the authorization grant in, and the endpoint takes it out;
 * - the endpoint puts the new session in, and the caller takes it out with the handle the endpoint
 *   answered with.
 *
 * One slot each. A login is one journey, and a renewal is single flight, so nothing here ever waits
 * behind anything else, and a slot whose receipt a caller dropped is overwritten by the next grant.
 *
 * Module state, like the session store itself: one process holds one Card session.
 */

/** The grant waiting for the next code exchange. */
let pendingGrant: CardAuthorizationGrant | null = null;

/** The session the last grant handed over, with the handle it answered with. */
let handedOver: { readonly handle: string; readonly session: CardSessionCredentials } | null = null;

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
  handleCounter += 1;
  handedOver = { handle: `card-session-${handleCounter}`, session };
  return handedOver.handle;
}

/**
 * Called by whoever dispatched the grant, with the handle from its receipt. Reads once.
 *
 * The handle is compared, not merely read. A caller must never be handed a session a different
 * grant put here, because the two can belong to different users.
 */
export function takeCardSession(handle: string): CardSessionCredentials | null {
  if (handedOver?.handle !== handle) {
    return null;
  }

  const { session } = handedOver;
  handedOver = null;
  return session;
}

export function forgetReceivedCardSessions(): void {
  handedOver = null;
}
