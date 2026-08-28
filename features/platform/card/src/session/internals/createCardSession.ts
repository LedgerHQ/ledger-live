import { cardManagementApi } from "@domain/api-card-management";
import {
  traceCard,
  type CardSessionRefreshResult,
  type CardSessionSnapshot,
} from "@shared/api-services";
import {
  CardSessionNotStoredError,
  type CardSessionRenewalConfig,
  type StoredCardSession,
} from "../types";
import { describeRenewalFailure } from "./renewalFailure";
import {
  forgetCardAuthorizationGrant,
  forgetReceivedCardSessions,
  takeCardSession,
} from "../sessionHandoff";
import { CARD_LEGACY_SESSION_KEYS, CARD_SESSION_KEYS, type CardSessionStore } from "./sessionStore";

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
   * True from a clear until the next successful write.
   *
   * A locked keychain rejects every removal, so a cleared access token can still read back. The flag
   * keeps "cleared means no Bearer" true for the life of the process. A restart reads the store
   * again, and a token that outlived its session answers 401, which clears it for good.
   */
  let isCleared = false;

  /**
   * Bumped on every `set` and `clear`, synchronously, at call time. This is the session's identity.
   *
   * `takeTurn` orders operations by the moment they were dispatched, not by what their callers meant.
   * So a renewal that starts before a logout, and whose write lands after the clear, would restore a
   * session the user ended. The counter is the intent the queue cannot express: a renewal reads it
   * before it starts, and its write compares it again before it stores anything.
   *
   * The base query reads it too, as the `epoch` of {@link CardSessionSnapshot}. It sends the epoch
   * back with its renewal request, so a request that outlived its session neither renews the new one
   * nor clears it.
   */
  let generation = 0;

  /**
   * The generation whose session terminal cleanup has already ended.
   *
   * A request still holding that generation asked about a session this package knows is finished, so
   * it is told so, rather than being told its session was merely replaced.
   */
  let endedGeneration: number | null = null;

  /** The one renewal every concurrent caller shares. Always belongs to the current generation. */
  let inFlight: Promise<CardSessionRefreshResult> | null = null;

  /** The terminal cleanup in progress, so concurrent terminal outcomes run it once. */
  let ending: Promise<void> | null = null;

  let renewal: CardSessionRenewalConfig | null = null;

  /* ---------------------------------------------------------------- storage */

  async function writeSession(
    session: StoredCardSession,
    expectedGeneration: number,
  ): Promise<"written" | "stale"> {
    // A clear or a newer login said what it wanted before this turn ran.
    if (expectedGeneration !== generation) {
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
    if (expectedGeneration !== generation) {
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

    // The one path that can take a key an earlier build left behind. See `CARD_LEGACY_SESSION_KEYS`.
    for (const key of CARD_LEGACY_SESSION_KEYS) {
      await store.remove(key).catch(() => undefined);
    }
  }

  async function readAccessToken(): Promise<string | null> {
    if (isCleared) {
      return null;
    }

    return store.read(CARD_SESSION_KEYS.accessToken);
  }

  async function readSession(): Promise<StoredCardSession | null> {
    if (isCleared) {
      return null;
    }

    const [accessToken, refreshToken] = await Promise.all([
      readAccessToken(),
      store.read(CARD_SESSION_KEYS.refreshToken),
    ]);

    // A session is only a session when both halves agree. Half of one reads as none, which sends the
    // user to the login screen instead of into a broken state.
    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  /* ---------------------------------------------------------------- renewal */

  function invalidateRenewal(): void {
    inFlight = null;
  }

  function renewSession(): Promise<CardSessionRefreshResult> {
    const capturedGeneration = generation;
    // Deferred by one microtask, so `inFlight` is set before any of the attempt runs. Otherwise an
    // attempt that ends the session synchronously would clear a field this line then re-assigns.
    const attempt = Promise.resolve().then(() => runRenewal(capturedGeneration));
    inFlight = attempt;

    // Identity-checked, so a settling attempt never clears a newer one.
    const settle = () => {
      if (inFlight === attempt) {
        inFlight = null;
      }
    };
    attempt.then(settle, settle);

    return attempt;
  }

  async function runRenewal(capturedGeneration: number): Promise<CardSessionRefreshResult> {
    if (!renewal) {
      // The one answer that is not terminal: no request was made, so nothing was learned about the
      // session. An app that forgot to install the renewal must not log its users out.
      return unavailable("card session renewal is not configured");
    }

    let handle: string;
    try {
      // The grant takes no argument and answers with no token: it reads the refresh token off the
      // api's `extra` — the only read of that key in a renewal — and hands the new session over
      // through `receiveCardSession`. `track: false` keeps the receipt out of the store.
      const receipt = await renewal
        .dispatch(cardManagementApi.endpoints.refreshSession.initiate(undefined, { track: false }))
        .unwrap();
      handle = receipt.sessionHandle;
    } catch (error) {
      // Every answer but a new session ends the session. The status is traced, not read: nothing
      // classifies a renewal failure any more. See "Renewal" in the README.
      traceCard(
        "renewal",
        `the grant answered ${describeRenewalFailure(error)} → the session ends`,
      );
      return endIfCurrent(capturedGeneration);
    }

    const session = takeCardSession(handle);
    if (!session) {
      // The grant succeeded, so Baanx rotated the refresh token and the stored one is spent. The new
      // one went with the hand-off, so there is nothing left to renew with.
      traceCard("renewal", "the grant answered with no session → the session ends");
      return endIfCurrent(capturedGeneration);
    }

    let outcome: "written" | "stale";
    try {
      outcome = await takeTurn(() => writeSession(session, capturedGeneration));
    } catch {
      // A renewed session that cannot be stored leaves nothing to use: Baanx rotates the refresh
      // token on every grant, so the provider no longer accepts the previous one.
      traceCard("renewal", "the new session could not be stored → the session ends");
      return endIfCurrent(capturedGeneration);
    }

    // "stale" means a clear or a login replaced the session while the grant was in flight. The new
    // token belongs to that session, not to the request that asked for this renewal.
    return outcome === "written"
      ? { kind: "refreshed", accessToken: session.accessToken }
      : { kind: "session-replaced" };
  }

  function unavailable(reason: string): CardSessionRefreshResult {
    return { kind: "unavailable", reason };
  }

  /**
   * Ends the session, but only the one this renewal started from.
   *
   * A failed renewal for an old session says nothing about the one a new login has just stored.
   * Without the test, a rejected grant for the user who just left would wipe the keychain of the
   * user who just arrived.
   *
   * The test and the `++generation` inside `clear()` are both synchronous, so nothing can replace
   * the session between them.
   */
  function endIfCurrent(capturedGeneration: number): Promise<CardSessionRefreshResult> {
    if (capturedGeneration === generation) {
      return endCardSession().then(() => ({ kind: "session-ended" }) as const);
    }

    return Promise.resolve(
      capturedGeneration === endedGeneration
        ? ({ kind: "session-ended" } as const)
        : ({ kind: "session-replaced" } as const),
    );
  }

  /** Idempotent, coalesced, and it attempts every step even when one of them fails. */
  function endCardSession(): Promise<void> {
    // Synchronous, so nobody new joins an attempt whose session is already over.
    inFlight = null;

    if (ending) {
      return ending;
    }

    // Recorded before `clear()` bumps it, so a request still holding this generation is told the
    // session ended rather than that it was replaced.
    endedGeneration = generation;

    const run = (async () => {
      await clear();
      try {
        renewal?.onCardSessionEnded();
      } catch (error) {
        // The app's own projection failed. The session is over either way.
        console.error("[card] onCardSessionEnded failed", error);
      }
    })();

    ending = run;
    const settle = () => {
      if (ending === run) {
        ending = null;
      }
    };
    run.then(settle, settle);

    return run;
  }

  /* ---------------------------------------------------------------- surface */

  const set = async (session: StoredCardSession): Promise<void> => {
    const captured = ++generation;
    invalidateRenewal();

    const outcome = await takeTurn(() => writeSession(session, captured));
    if (outcome === "stale") {
      // Nothing was stored. Reported as success, this would send the login machine on to its next
      // request with no Bearer to send, and the user into a loop instead of onto the login screen.
      throw new CardSessionNotStoredError();
    }
  };

  const clear = (): Promise<void> => {
    ++generation;
    invalidateRenewal();
    forgetCardAuthorizationGrant();
    forgetReceivedCardSessions();
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
   * During a `set` it answers the previous token, which stays valid until the new one lands. The
   * request path must not queue behind a login.
   *
   * The epoch is read first, so it can only name the session the token came from or an older one.
   * Older is the safe side: the base query then replays nothing and clears nothing.
   */
  const readCardSession = async (): Promise<CardSessionSnapshot> => {
    const epoch = generation;
    return { token: await readAccessToken(), epoch };
  };

  /** The reader the renewal grant gets. It reads the other key, and never renews. */
  async function getCardRefreshToken(): Promise<string | null> {
    return isCleared ? null : store.read(CARD_SESSION_KEYS.refreshToken);
  }

  /**
   * The one entry point, called by the base query after the provider answered 401.
   *
   * `epoch` is the generation the request was sent with. A request that outlived its session gets
   * `session-replaced`, and the base query then reports the original 401 without ending anything.
   *
   * Concurrent callers of the same session share one attempt. A request can only reach this once,
   * because the base query replays at most once and does not renew again on the replay's answer.
   */
  async function refreshCardSession(epoch: number): Promise<CardSessionRefreshResult> {
    if (epoch !== generation) {
      return epoch === endedGeneration ? { kind: "session-ended" } : { kind: "session-replaced" };
    }

    if (isCleared) {
      return { kind: "session-ended" };
    }

    return inFlight ?? renewSession();
  }

  /**
   * Installs the renewal. Called once per store, after the store exists, and answers with the call
   * that uninstalls it again. A second install replaces the first: one process serves one session,
   * so the newest store is the one a renewal must reach.
   *
   * The mutation it dispatches MUST bypass Bearer injection and the 401 renewal
   * (`extraOptions.authenticated: false`). A renewal that went through the authenticated path would
   * answer 401, renew again, and loop.
   */
  const configureCardSessionRenewal = (config: CardSessionRenewalConfig): (() => void) => {
    renewal = config;

    return () => {
      if (renewal === config) {
        renewal = null;
      }
    };
  };

  return {
    cardSession: { set, get, clear },
    getCardSessionToken,
    readCardSession,
    getCardRefreshToken,
    refreshCardSession,
    configureCardSessionRenewal,
  };
}
