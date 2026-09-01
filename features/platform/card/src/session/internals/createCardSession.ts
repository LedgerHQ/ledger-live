import { refreshSession } from "@domain/api-card-management";
import type { CardSessionRefreshResult, CardSessionSnapshot } from "@shared/api-services";
import {
  CardSessionNotStoredError,
  type CardSessionRenewalConfig,
  type StoredCardSession,
} from "../types";
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
   * from terminal cleanup, which the request path triggers. Unqueued, a `clear` lands between the
   * two phases of a `set` and leaves the access token alone on disk.
   */
  let turn: Promise<unknown> = Promise.resolve();

  function takeTurn<T>(operation: () => Promise<T>): Promise<T> {
    const result = turn.then(operation, operation);
    // A failed turn must not poison the queue for the next one.
    turn = result.catch(() => undefined);
    return result;
  }

  /**
   * True from the start of a replacement or clear until the next successful write.
   *
   * A locked keychain rejects every removal, so a cleared access token can still read back. The flag
   * keeps "cleared means no Bearer" true for the life of the process. A restart reads the store
   * again, and a token that outlived its session answers 401, which clears it for good.
   */
  let isCleared = false;

  /**
   * Which session is on disk. Every `set` and every `clear` starts a new one, so both bump this.
   *
   * A renewal takes time. A logout or a new login can land in the middle of one, and then the
   * renewal is holding the id of a session that no longer exists. So a renewal reads the id before
   * it starts and compares it again before it writes or clears anything. If the id moved, the
   * renewal does nothing: the session on disk is not the one it was renewing.
   *
   * Without it, a renewal that began before a logout would put the session back after it, and a
   * renewal that failed for the user who just left would wipe the keychain of the one who just
   * arrived.
   *
   * The base query reads it too, as the `sessionId` of {@link CardSessionSnapshot}, and hands it
   * back when it asks for a renewal.
   */
  let sessionId = 0;

  type InFlightRefresh = {
    failedAccessToken: string;
    promise: Promise<CardSessionRefreshResult>;
  };

  /** The refresh attempt concurrent callers for one failed token share. */
  let inFlight: InFlightRefresh | null = null;

  let renewal: CardSessionRenewalConfig | null = null;

  /* ---------------------------------------------------------------- storage */

  async function writeSession(
    session: StoredCardSession,
    expectedSessionId: number,
  ): Promise<"written" | "stale"> {
    // A clear or a newer login said what it wanted before this turn ran.
    if (expectedSessionId !== sessionId) {
      return "stale";
    }

    try {
      // The refresh token first, the access token last: the access token is the only key the request
      // path reads, so it must never point at a session the store has not finished.
      await store.write(CARD_SESSION_KEYS.refreshToken, session.refreshToken);
      await store.write(CARD_SESSION_KEYS.accessToken, session.accessToken);
    } catch (error) {
      // Every key that landed is a credential, the refresh token included, so remove them all.
      await removeSession();
      throw error;
    }

    // Checked again before the flag drops: a clear can land between the two writes. Undo, or a
    // cleared session reads back after a restart.
    if (expectedSessionId !== sessionId) {
      await removeSession();
      return "stale";
    }

    isCleared = false;

    return "written";
  }

  /**
   * Removes the credentials the request path reads first, and never rejects.
   *
   * Never rejects, because `isCleared` has already ended the session: a removal the store refused
   * leaves a value that nothing will serve, so the caller has nothing to handle.
   */
  async function removeSession(): Promise<void> {
    // Raised before the first removal, so a store that refuses to forget cannot keep the session.
    isCleared = true;

    await store.remove(CARD_SESSION_KEYS.accessToken).catch(() => undefined);
    await store.remove(CARD_SESSION_KEYS.refreshToken).catch(() => undefined);
    await store.remove(CARD_SESSION_KEYS.lifetimes).catch(() => undefined);
  }

  /**
   * Reads one key, and answers nothing for a session that ended while the read was in flight.
   *
   * The guard before the read is not enough on its own. A store read takes time, and a clear or a
   * login can land inside it. Read once, the guard would serve a token from a session that is over
   * to a caller holding nothing to notice it with. So the session the read started from is compared
   * again after the read, and only a token that still belongs to that session is served.
   *
   * {@link readCardSession} is the one reader that does not come through here. It answers with a
   * pair, and the id in that pair is how its caller tells a stale token from a current one.
   */
  async function readToken(key: string): Promise<string | null> {
    if (isCleared) {
      return null;
    }

    const reading = sessionId;
    const token = await store.read(key);

    return isCleared || reading !== sessionId ? null : token;
  }

  async function readAccessToken(): Promise<string | null> {
    return readToken(CARD_SESSION_KEYS.accessToken);
  }

  /** Private. The refresh token leaves this module only inside a grant request. */
  async function readRefreshToken(): Promise<string | null> {
    return readToken(CARD_SESSION_KEYS.refreshToken);
  }

  async function readSession(): Promise<StoredCardSession | null> {
    if (isCleared) {
      return null;
    }

    const [accessToken, refreshToken] = await Promise.all([readAccessToken(), readRefreshToken()]);

    // A session is only a session when both halves agree. Half of one reads as none, which sends the
    // user to the login screen instead of into a broken state.
    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  /* ---------------------------------------------------------------- renewal */

  function startRefresh(
    requestSessionId: number,
    failedAccessToken: string,
  ): Promise<CardSessionRefreshResult> {
    // Deferred by one microtask, so `inFlight` is set before any of the attempt runs. Otherwise an
    // attempt that ends the session synchronously would clear a field this line then re-assigns.
    const attempt = Promise.resolve().then(() => runRefresh(requestSessionId, failedAccessToken));
    inFlight = { failedAccessToken, promise: attempt };

    // Identity-checked, so a settling attempt never clears a newer one.
    const settle = () => {
      if (inFlight?.promise === attempt) {
        inFlight = null;
      }
    };
    attempt.then(settle, settle);

    return attempt;
  }

  /**
   * One good outcome, and one `catch`.
   *
   * A renewal that produced a session on disk renews it. Everything else — no renewal installed, a
   * store that cannot be read, a grant the provider refused, a body the schema rejects, a write that
   * failed — ends the session. Nothing here reads a status and nothing reads a body: one rule leaves
   * no way for a session to look alive and behave dead.
   */
  async function runRefresh(
    requestSessionId: number,
    failedAccessToken: string,
  ): Promise<CardSessionRefreshResult> {
    try {
      const currentAccessToken = await readAccessToken();

      if (requestSessionId !== sessionId) {
        return { kind: "session-replaced" };
      }

      if (!currentAccessToken) {
        throw new Error("the Card session holds no access token");
      }

      if (currentAccessToken !== failedAccessToken) {
        return { kind: "refreshed", accessToken: currentAccessToken };
      }

      const session = await grantNewSession();
      const outcome = await takeTurn(() => writeSession(session, requestSessionId));

      // "stale" means a clear or a login replaced the session while the grant was in flight. The new
      // token belongs to that session, not to the request that asked for this renewal.
      return outcome === "written"
        ? { kind: "refreshed", accessToken: session.accessToken }
        : { kind: "session-replaced" };
    } catch {
      return endIfCurrent(requestSessionId);
    }
  }

  /**
   * Reads the refresh token and spends it. Baanx rotates it on every grant, so the stored one is
   * worthless the moment this resolves, whatever it resolves to.
   */
  async function grantNewSession(): Promise<StoredCardSession> {
    if (!renewal) {
      throw new Error("the Card session renewal is not configured");
    }

    const refreshToken = await readRefreshToken();
    if (!refreshToken) {
      throw new Error("the Card session holds no refresh token");
    }

    // A plain thunk: dispatching it runs the grant and answers with the session. It dispatches no
    // action of its own, so no credential reaches redux.
    return renewal.dispatch(refreshSession(refreshToken));
  }

  /**
   * Ends the session this renewal started from, and only that one.
   *
   * If the id moved, a logout or a new login already replaced that session, so there is nothing here
   * to end. Without the test, a failed renewal for the user who just left would wipe the keychain of
   * the one who just arrived.
   *
   * The test and the `++sessionId` inside `clear()` are both synchronous, so nothing can replace the
   * session between them.
   */
  async function endIfCurrent(renewing: number): Promise<CardSessionRefreshResult> {
    if (renewing !== sessionId) {
      return { kind: "session-replaced" };
    }

    const clearing = clear();
    console.warn("[card] the session renewal failed, so the session is over");
    await clearing;
    try {
      renewal?.onCardSessionEnded();
    } catch {
      console.error("[card] onCardSessionEnded failed");
    }

    return { kind: "session-ended" };
  }

  /* ---------------------------------------------------------------- surface */

  const beginSessionReplacement = (): number => {
    isCleared = true;
    inFlight = null;
    return ++sessionId;
  };

  const set = async (session: StoredCardSession): Promise<void> => {
    const written = beginSessionReplacement();

    const outcome = await takeTurn(() => writeSession(session, written));
    if (outcome === "stale") {
      // Nothing was stored. Reported as success, this would send the login machine on to its next
      // request with no Bearer to send, and the user into a loop instead of onto the login screen.
      throw new CardSessionNotStoredError();
    }
  };

  const clear = (): Promise<void> => {
    beginSessionReplacement();
    return takeTurn(removeSession);
  };

  /**
   * Takes a turn, because it reads both keys. A `set` over a live session replaces the refresh token
   * before the access token, so an unqueued read pairs the previous access token with the new
   * refresh token. `get` is off the request path, so the wait costs nothing there.
   */
  const get = (): Promise<StoredCardSession | null> => takeTurn(readSession);

  /** True when a session is on disk. Rejects when the store could not be read. */
  const getCardSessionToken = (): Promise<string | null> => readAccessToken();

  /**
   * The reader `cardApiExtra` gets. It reads, and nothing else: a session is renewed only after the
   * provider has refused one.
   *
   * It never waits for a turn: the access token is one key, and one key cannot disagree with itself.
   * During a replacement `set` it answers no token. The request path must not queue behind a login.
   *
   * The id is read first, so it can only name the session the token came from or an older one.
   * Older is the safe side: the base query then replays nothing and clears nothing.
   *
   * It serves the token the store answered, and does not drop it for a session that moved during
   * the read, the way {@link readToken} does. The base query reads no token as "this request has no
   * Bearer to send" and sends it anonymously. A replacement must not turn an authenticated request
   * into an anonymous one, so a token that outlived its session is served with the id it came with,
   * and `isCardSessionCurrent` is what holds the request back.
   */
  const readCardSession = async (): Promise<CardSessionSnapshot> => {
    const id = sessionId;
    const token = isCleared ? null : await store.read(CARD_SESSION_KEYS.accessToken);
    return { token, sessionId: id };
  };

  const isCardSessionCurrent = (requestSessionId: number): boolean =>
    !isCleared && requestSessionId === sessionId;

  /**
   * The one entry point, called by the base query after the provider answered 401.
   *
   * `requestSessionId` is the session the request was sent with. If it is not the session on disk
   * any more, the request outlived it: nothing is renewed and nothing is cleared, and the base query
   * answers the caller with a stale-request error.
   *
   * Concurrent callers carrying the same failed token share one attempt. A caller carrying another
   * token waits for that attempt and rechecks, so a stale 401 cannot hide a current token's 401.
   */
  function refreshCardSession(
    requestSessionId: number,
    failedAccessToken: string,
  ): Promise<CardSessionRefreshResult> {
    if (requestSessionId !== sessionId) {
      return Promise.resolve({ kind: "session-replaced" });
    }

    if (isCleared) {
      return Promise.resolve({ kind: "session-ended" });
    }

    if (!inFlight) {
      return startRefresh(requestSessionId, failedAccessToken);
    }

    if (inFlight.failedAccessToken === failedAccessToken) {
      return inFlight.promise;
    }

    const activeRefresh = inFlight.promise;
    const recheck = () => refreshCardSession(requestSessionId, failedAccessToken);
    return activeRefresh.then(recheck, recheck);
  }

  /**
   * Installs the renewal. Called once per store, at the app's composition root, because a renewal
   * dispatches through the store and the store does not exist while its own `extraArgument` is being
   * built. A second install replaces the first: one process serves one session.
   */
  const configureCardSessionRenewal = (config: CardSessionRenewalConfig): void => {
    renewal = config;
  };

  return {
    cardSession: { set, get, clear },
    getCardSessionToken,
    readCardSession,
    isCardSessionCurrent,
    refreshCardSession,
    configureCardSessionRenewal,
  };
}
