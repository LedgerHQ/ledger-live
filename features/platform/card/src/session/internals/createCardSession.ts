import { cardManagementApi } from "@domain/api-card-management";
import type { CardSessionRefreshResult } from "@shared/api-services";
import type {
  CardSessionRenewalConfig,
  CardSessionRenewalError,
  StoredCardSession,
} from "../types";
import { isRenewedSession, isTerminalRenewalFailure, sanitizeRenewalError } from "./renewalFailure";
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
   * True from a clear until the next successful write.
   *
   * A locked keychain rejects every removal, so a cleared access token can still read back. The flag
   * keeps "cleared means no Bearer" true for the life of the process. A restart reads the store
   * again, and a token that outlived its session answers 401, which clears it for good.
   */
  let isCleared = false;

  /**
   * Bumped on every `set` and `clear`, synchronously, at call time.
   *
   * `takeTurn` orders operations by the moment they were dispatched, not by what their callers meant.
   * So a renewal that starts before a logout, and whose write lands after the clear, would bring the
   * session back to life. The counter is the intent the queue cannot express: a renewal reads it
   * before it starts, and its write compares it again before it stores anything.
   */
  let generation = 0;

  /** The one renewal every concurrent caller shares. */
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
    if (inFlight) {
      return inFlight;
    }

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
      // Never terminal. An app that forgot to install the renewal must not log its users out.
      return unavailable({ message: "card session renewal is not configured" });
    }

    let refreshToken: string | null;
    try {
      refreshToken = await store.read(CARD_SESSION_KEYS.refreshToken);
    } catch (error) {
      // A read that failed says nothing about the session.
      return unavailable(sanitizeRenewalError(error));
    }

    if (!refreshToken) {
      return endAndReportSessionEnded();
    }

    let session: StoredCardSession;
    try {
      // The endpoint takes no argument: it reads the refresh token off the api's `extra`, so no
      // token becomes a mutation argument. `track: false` keeps the answer out of the store.
      session = await renewal
        .dispatch(cardManagementApi.endpoints.refreshSession.initiate(undefined, { track: false }))
        .unwrap();
    } catch (error) {
      if (isTerminalRenewalFailure(error)) {
        return endAndReportSessionEnded();
      }
      return unavailable(sanitizeRenewalError(error));
    }

    // Nonterminal: the session may still be good, and the request that triggered this already has
    // its 401 answer. A token that really is dead answers 401 again on the next request.
    if (!isRenewedSession(session)) {
      return unavailable({ message: "the renewal answered with no session" });
    }

    let outcome: "written" | "stale";
    try {
      outcome = await takeTurn(() => writeSession(session, capturedGeneration));
    } catch (error) {
      // A renewed session that cannot be stored is worse than none: the old token is already spent.
      void error;
      return endAndReportSessionEnded();
    }

    if (outcome === "written") {
      return { kind: "refreshed", accessToken: session.accessToken };
    }

    // A clear or a login overtook this renewal. Queue behind it, then report what it left behind.
    const current = await takeTurn(readSession);
    return current
      ? { kind: "refreshed", accessToken: current.accessToken }
      : { kind: "session-ended" };
  }

  function unavailable(error: CardSessionRenewalError): CardSessionRefreshResult {
    return { kind: "unavailable", error };
  }

  async function endAndReportSessionEnded(): Promise<CardSessionRefreshResult> {
    // `session-ended` reports cleanup that has already finished, not cleanup about to start.
    await endCardSession();
    return { kind: "session-ended" };
  }

  /** Idempotent, coalesced, and it attempts every step even when one of them fails. */
  function endCardSession(): Promise<void> {
    // Synchronous, so nobody new joins an attempt whose session is already over.
    inFlight = null;

    if (ending) {
      return ending;
    }

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

  const set = (session: StoredCardSession): Promise<void> => {
    const captured = ++generation;
    invalidateRenewal();
    return takeTurn(() => writeSession(session, captured)).then(() => undefined);
  };

  const clear = (): Promise<void> => {
    ++generation;
    invalidateRenewal();
    return takeTurn(removeSession);
  };

  /**
   * Takes a turn, because it reads both keys. A `set` over a live session replaces the refresh token
   * before the access token, so an unqueued read pairs the previous access token with the new
   * refresh token. `get` is off the request path, so the wait costs nothing there.
   */
  const get = (): Promise<StoredCardSession | null> => takeTurn(readSession);

  /**
   * The reader `cardApiExtra` gets. It reads, and nothing else: a session is renewed only after the
   * provider has refused one.
   *
   * It never waits for a turn: the access token is one key, and one key cannot disagree with itself.
   * During a `set` it answers the previous token, which stays valid until the new one lands. The
   * request path must not queue behind a login.
   */
  const getCardSessionToken = (): Promise<string | null> => readAccessToken();

  /** The reader the renewal endpoint gets. It reads the other key, and never renews. */
  async function getCardRefreshToken(): Promise<string | null> {
    return isCleared ? null : store.read(CARD_SESSION_KEYS.refreshToken);
  }

  /**
   * The one entry point, called by the base query after the provider answered 401.
   *
   * Concurrent callers share one attempt. A request can only reach this once, because the base query
   * replays at most once and does not renew again on the replay's answer.
   */
  async function refreshCardSession(): Promise<CardSessionRefreshResult> {
    if (isCleared) {
      return { kind: "session-ended" };
    }
    if (inFlight) {
      return inFlight;
    }
    return renewSession();
  }

  /**
   * Installs the renewal. Called once, after the store exists.
   *
   * The mutation it dispatches MUST bypass Bearer injection and the 401 renewal
   * (`extraOptions.authenticated: false`). A renewal that went through the authenticated path would
   * answer 401, renew again, and loop.
   */
  const configureCardSessionRenewal = (config: CardSessionRenewalConfig): void => {
    renewal = config;
  };

  return {
    cardSession: { set, get, clear },
    getCardSessionToken,
    getCardRefreshToken,
    refreshCardSession,
    configureCardSessionRenewal,
  };
}
