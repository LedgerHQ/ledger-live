/**
 * In-memory Card session shared across flows.
 *
 * The Card session token is a Bearer credential that must never be persisted alongside UI preferences
 * (see the `payCard` slice, which persists only `hasSeenFeatureTour` / `balanceFilter`). It lives here,
 * in module memory, for the lifetime of the app process. Card Auth writes it after a successful login;
 * the shared `cardApi` reads it through the accessors below, injected by the app via `cardApiExtra`.
 */
let currentToken: string | null = null;

export const cardSession = {
  /** Stores the session token returned by Card Auth (nullish clears it). */
  set(token: string | null | undefined): void {
    currentToken = token ?? null;
  },
  /** Drops the current session, e.g. on logout or an unrecoverable `401`. */
  clear(): void {
    currentToken = null;
  },
  /** Current session token, or `null` when logged out. */
  getToken(): string | null {
    return currentToken;
  },
};

/**
 * Reader passed to `cardApiExtra`: the shared Card base query calls this before every request to
 * attach the `Authorization: Bearer` header.
 */
export function getCardSessionToken(): string | null | undefined {
  return cardSession.getToken();
}

/**
 * Refresh handler passed to `cardApiExtra`: the shared Card base query calls this once after a `401`.
 *
 * Scaffold behaviour: there is no refresh contract yet (the Card session entity carries no refresh
 * token), so this clears the session and reports that it cannot be renewed, which surfaces the `401`
 * to the caller. Card Auth replaces this with a real renewal once it migrates onto `cardApi`.
 */
export async function refreshCardSession(): Promise<string | null | undefined> {
  cardSession.clear();
  return null;
}
