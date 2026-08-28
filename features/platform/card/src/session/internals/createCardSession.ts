import type { PayCardSession } from "@domain/api-card-management";
import { CARD_SESSION_KEYS, type CardSessionStore } from "./sessionStore";

/**
 * Builds the session accessors over one store. The platform picks the store; everything else about a
 * Card session is the same on every platform.
 */
export function createCardSession(store: CardSessionStore) {
  /**
   * One queue for `set`, `clear` and `get`, because each one touches more than one key.
   *
   * Their callers know nothing about each other: `set` runs from the login machine, and `clear` runs
   * from `refreshCardSession`, which the base query calls on any 401. Unqueued, a `clear` lands between
   * the two phases of a `set` and leaves the access token alone on disk.
   */
  let turn: Promise<unknown> = Promise.resolve();

  function takeTurn<T>(operation: () => Promise<T>): Promise<T> {
    const result = turn.then(operation, operation);
    // A failed turn must not poison the queue for the next one.
    turn = result.catch(() => undefined);
    return result;
  }

  /**
   * True from a clear until the next successful write.
   *
   * A locked keychain rejects every removal, so a cleared access token can still read back. The flag
   * keeps "cleared means no Bearer" true for the life of the process. A restart reads the store again,
   * and a token that outlived its session answers 401, which clears it for good.
   */
  let isCleared = false;

  async function writeSession(session: PayCardSession): Promise<void> {
    try {
      // The access token is written last, because it is the only key the request path reads.
      const coldWriteResults = await Promise.allSettled([
        store.write(CARD_SESSION_KEYS.refreshToken, session.refreshToken),
        store.write(CARD_SESSION_KEYS.lifetimes, JSON.stringify({ expiresIn: session.expiresIn })),
      ]);
      const failedColdWrite = coldWriteResults.find(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      if (failedColdWrite) {
        throw failedColdWrite.reason;
      }

      await store.write(CARD_SESSION_KEYS.accessToken, session.accessToken);
    } catch (error) {
      // The login is over. Every key that landed is a credential, the refresh token included, so
      // remove them all.
      await removeSession();
      throw error;
    }

    isCleared = false;
  }

  async function readSession(): Promise<PayCardSession | null> {
    if (isCleared) {
      return null;
    }

    const [accessToken, refreshToken, lifetimes] = await Promise.all([
      store.read(CARD_SESSION_KEYS.accessToken),
      store.read(CARD_SESSION_KEYS.refreshToken),
      store.read(CARD_SESSION_KEYS.lifetimes),
    ]);

    // A session is only a session when all three keys agree. Half of one reads as none, which sends
    // the user to the login screen instead of into a broken state.
    const parsedLifetimes = parseLifetimes(lifetimes);
    if (!accessToken || !refreshToken || !parsedLifetimes) {
      return null;
    }

    return { accessToken, refreshToken, ...parsedLifetimes };
  }

  /**
   * Removes the access token first, and never rejects.
   *
   * First, because every Card request reads that key. Never rejects, because `isCleared` has already
   * ended the session: a removal the store refused leaves a value that nothing will serve, so the
   * caller has nothing to handle. `refreshCardSession` therefore always answers the base query, whose
   * guard against a rejected port never fires here.
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
   * Takes a turn, because it reads all three keys. A `set` over a live session replaces the two cold
   * keys before the access token, so an unqueued read pairs the previous access token with the new
   * refresh token. `get` is off the request path, so the wait costs nothing there.
   */
  const get = () => takeTurn(readSession);

  /**
   * The reader `cardApiExtra` gets. One key, because the header needs one value.
   *
   * It never waits for a turn: one key cannot disagree with itself. During a `set` it answers the
   * previous access token, which stays valid until the new one lands. The request path must not queue
   * behind a login.
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

/** Unreadable or incomplete lifetimes answer null, so the caller reports no session. */
function parseLifetimes(value: string | null): Pick<PayCardSession, "expiresIn"> | null {
  if (!value) {
    return null;
  }

  try {
    const { expiresIn } = JSON.parse(value) as Record<string, unknown>;
    return typeof expiresIn === "number" ? { expiresIn } : null;
  } catch {
    return null;
  }
}
