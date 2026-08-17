import type { PayCardSession } from "@domain/api-card-management";
import { CARD_SESSION_KEYS, type CardSessionStore } from "./sessionStore";

/**
 * Builds the session accessors over one store. The platform picks the store; everything else about a
 * Card session is the same on every platform.
 */
export function createCardSession(store: CardSessionStore) {
  /**
   * `set` and `clear` take turns. They have callers that know nothing about each other: `set` runs from
   * the login machine, and `clear` runs from `refreshCardSession`, which the Card base query calls on
   * any 401 — outside React, and outside the machine. Interleaved, the removal of the cold keys could
   * land between this write's two phases and leave the access token alone on disk.
   */
  let turn: Promise<unknown> = Promise.resolve();

  function takeTurn<T>(operation: () => Promise<T>): Promise<T> {
    const result = turn.then(operation, operation);
    // A failed turn must not poison the queue for the next one.
    turn = result.catch(() => undefined);
    return result;
  }

  /**
   * True from the moment a session is cleared until a write succeeds.
   *
   * The store can refuse to forget — a locked keychain rejects every removal — and the access token
   * would still read back afterwards. This flag makes "cleared means no Bearer" hold for the life of the
   * process whatever the store did. A restart reads the store again, and a token that outlived its
   * session answers 401, which clears it for good.
   */
  let isCleared = false;

  async function writeSession(session: PayCardSession): Promise<void> {
    try {
      // The access token is written last, because it is the only key the request path reads.
      const coldWriteResults = await Promise.allSettled([
        store.write(CARD_SESSION_KEYS.refreshToken, session.refreshToken),
        store.write(
          CARD_SESSION_KEYS.lifetimes,
          JSON.stringify({
            expiresIn: session.expiresIn,
            refreshTokenExpiresIn: session.refreshTokenExpiresIn,
          }),
        ),
      ]);
      const failedColdWrite = coldWriteResults.find(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      if (failedColdWrite) {
        throw failedColdWrite.reason;
      }

      await store.write(CARD_SESSION_KEYS.accessToken, session.accessToken);
    } catch (error) {
      // Any failure ends the login, and every key it managed to write is a credential — the refresh
      // token as much as the access token. Remove whatever landed.
      await removeSession();
      throw error;
    }

    isCleared = false;
  }

  async function get(): Promise<PayCardSession | null> {
    if (isCleared) {
      return null;
    }

    const [accessToken, refreshToken, lifetimes] = await Promise.all([
      store.read(CARD_SESSION_KEYS.accessToken),
      store.read(CARD_SESSION_KEYS.refreshToken),
      store.read(CARD_SESSION_KEYS.lifetimes),
    ]);

    const parsedLifetimes = parseLifetimes(lifetimes);
    if (!accessToken || !refreshToken || !parsedLifetimes) {
      return null;
    }

    return { accessToken, refreshToken, ...parsedLifetimes };
  }

  /**
   * The access token goes first, and no removal may reject. Every Card request reads that key, so a
   * cleared session must stop sending a Bearer even when the store refuses to forget — which is what
   * `isCleared` guarantees, because a rejected removal leaves the value readable.
   *
   * Never throwing is the load-bearing part: the base query awaits `refreshCardSession` on a 401
   * without a try/catch, so a rejection here would turn a handled 401 into a thrown error that has lost
   * its `status`, and the login machine would read it as a network fault and keep the dead session.
   */
  async function removeSession(): Promise<void> {
    // Raised before the first removal, so a store that refuses to forget cannot keep the session alive.
    isCleared = true;

    await store.remove(CARD_SESSION_KEYS.accessToken).catch(() => undefined);
    await Promise.all([
      store.remove(CARD_SESSION_KEYS.refreshToken).catch(() => undefined),
      store.remove(CARD_SESSION_KEYS.lifetimes).catch(() => undefined),
    ]);
  }

  const set = (session: PayCardSession) => takeTurn(() => writeSession(session));
  const clear = () => takeTurn(removeSession);

  /**
   * The reader `cardApiExtra` gets. One key, because the header needs one value.
   *
   * It never waits for a turn. Reads cannot break the invariant — the access token exists only while
   * the whole session does — and the request path must not queue behind a login.
   */
  async function getCardSessionToken(): Promise<string | null> {
    return isCleared ? null : store.read(CARD_SESSION_KEYS.accessToken);
  }

  /** No renewal yet (LIVE-34741): a 401 ends the session. */
  async function refreshCardSession(): Promise<string | null> {
    await clear();
    return null;
  }

  return { cardSession: { set, get, clear }, getCardSessionToken, refreshCardSession };
}

/**
 * A session is only a session when all three keys agree. A half-written or unreadable payload reads
 * as no session, which sends the user back to the login screen instead of into a broken state.
 */
function parseLifetimes(
  value: string | null,
): Pick<PayCardSession, "expiresIn" | "refreshTokenExpiresIn"> | null {
  if (!value) {
    return null;
  }

  try {
    const { expiresIn, refreshTokenExpiresIn } = JSON.parse(value) as Record<string, unknown>;
    return typeof expiresIn === "number" && typeof refreshTokenExpiresIn === "number"
      ? { expiresIn, refreshTokenExpiresIn }
      : null;
  } catch {
    return null;
  }
}
