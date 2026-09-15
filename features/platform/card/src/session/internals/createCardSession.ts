import { cardManagementApi, initiatePayCardLogout } from "@domain/api-card-management";
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
  let turn: Promise<unknown> = Promise.resolve();

  function takeTurn<T>(operation: () => Promise<T>): Promise<T> {
    const result = turn.then(operation, operation);
    // A failed turn must not poison the queue for the next one.
    turn = result.catch(() => undefined);
    return result;
  }

  let isCleared = false;

  let sessionId = 0;

  /**
   * The provider app the login redirect named, mirrored in memory because the Card base query builds
   * its headers synchronously and cannot await the store. `readCardSession` fills the mirror, and the
   * base query awaits it before every authenticated request, so a platform that kept the session
   * across a restart answers from its first request on. A request that carries no session either had
   * the value set by the login a moment earlier, or follows an authenticated one that hydrated it.
   */
  let providerAppId: string | null = null;

  let isProviderAppIdHydrated = false;

  /** Counts the writes, so a read still in flight cannot put a stale value over a newer one. */
  let providerAppIdWrites = 0;

  /** The one read every concurrent caller waits on, so none of them builds headers ahead of it. */
  let providerAppIdHydration: Promise<void> | null = null;

  function hydrateProviderAppId(): Promise<void> {
    if (isProviderAppIdHydrated) {
      return Promise.resolve();
    }

    if (providerAppIdHydration) {
      return providerAppIdHydration;
    }

    const writesBeforeRead = providerAppIdWrites;
    providerAppIdHydration = store
      .read(CARD_SESSION_KEYS.providerAppId)
      .then(stored => {
        if (providerAppIdWrites === writesBeforeRead) {
          providerAppId = stored;
        }
        isProviderAppIdHydrated = true;
      })
      // The rejection is not swallowed: a request whose tenant we cannot read must fail rather than
      // leave for the default one. Clearing the promise still lets the next request ask again.
      .finally(() => {
        providerAppIdHydration = null;
      });

    return providerAppIdHydration;
  }

  function recordProviderAppId(appId: string | null): void {
    providerAppId = appId;
    isProviderAppIdHydrated = true;
    providerAppIdWrites += 1;
  }

  type InFlightRefresh = {
    failedAccessToken: string;
    promise: Promise<CardSessionRefreshResult>;
  };

  let inFlight: InFlightRefresh | null = null;

  let renewal: CardSessionRenewalConfig | null = null;

  async function writeSession(
    session: StoredCardSession,
    expectedSessionId: number,
  ): Promise<"written" | "stale"> {
    if (expectedSessionId !== sessionId) {
      return "stale";
    }

    try {
      await store.write(CARD_SESSION_KEYS.refreshToken, session.refreshToken);
      await store.write(CARD_SESSION_KEYS.accessToken, session.accessToken);
    } catch (error) {
      await removeSession();
      throw error;
    }

    if (expectedSessionId !== sessionId) {
      await removeSession();
      return "stale";
    }

    isCleared = false;

    return "written";
  }

  async function removeSession(): Promise<void> {
    isCleared = true;
    recordProviderAppId(null);

    await store.remove(CARD_SESSION_KEYS.accessToken).catch(() => undefined);
    await store.remove(CARD_SESSION_KEYS.refreshToken).catch(() => undefined);
    await store.remove(CARD_SESSION_KEYS.lifetimes).catch(() => undefined);
    await store.remove(CARD_SESSION_KEYS.providerAppId).catch(() => undefined);
  }

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

  async function readRefreshToken(): Promise<string | null> {
    return readToken(CARD_SESSION_KEYS.refreshToken);
  }

  async function readSession(): Promise<StoredCardSession | null> {
    if (isCleared) {
      return null;
    }

    const [accessToken, refreshToken] = await Promise.all([readAccessToken(), readRefreshToken()]);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  function startRefresh(
    requestSessionId: number,
    failedAccessToken: string,
  ): Promise<CardSessionRefreshResult> {
    const attempt = Promise.resolve().then(() => runRefresh(requestSessionId, failedAccessToken));
    inFlight = { failedAccessToken, promise: attempt };

    const settle = () => {
      if (inFlight?.promise === attempt) {
        inFlight = null;
      }
    };
    attempt.then(settle, settle);

    return attempt;
  }

  async function runRefresh(
    requestSessionId: number,
    failedAccessToken: string,
  ): Promise<CardSessionRefreshResult> {
    let logoutAccessToken = failedAccessToken;
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
      logoutAccessToken = session.accessToken;
      const outcome = await takeTurn(() => writeSession(session, requestSessionId));

      return outcome === "written"
        ? { kind: "refreshed", accessToken: session.accessToken }
        : { kind: "session-replaced" };
    } catch {
      return endIfCurrent(requestSessionId, logoutAccessToken);
    }
  }

  async function grantNewSession(): Promise<StoredCardSession> {
    if (!renewal) {
      throw new Error("the Card session renewal is not configured");
    }

    const refreshToken = await readRefreshToken();
    if (!refreshToken) {
      throw new Error("the Card session holds no refresh token");
    }

    return renewal
      .dispatch(
        cardManagementApi.endpoints.refreshSession.initiate({ refreshToken }, { track: false }),
      )
      .unwrap();
  }

  async function endIfCurrent(
    renewing: number,
    failedAccessToken: string,
  ): Promise<CardSessionRefreshResult> {
    if (renewing !== sessionId) {
      return { kind: "session-replaced" };
    }

    if (renewal) {
      try {
        void renewal
          .dispatch(initiatePayCardLogout(failedAccessToken))
          .unwrap()
          .catch(() => undefined);
      } catch {
        // Remote logout is best effort.
      }
    }

    const clearing = clear();
    await clearing;
    try {
      renewal?.onCardSessionEnded();
    } catch {
      console.error("[card] onCardSessionEnded failed");
    }

    return { kind: "session-ended" };
  }

  const beginSessionReplacement = (): number => {
    isCleared = true;
    inFlight = null;
    return ++sessionId;
  };

  const set = async (session: StoredCardSession): Promise<void> => {
    const written = beginSessionReplacement();

    const outcome = await takeTurn(() => writeSession(session, written));
    if (outcome === "stale") {
      throw new CardSessionNotStoredError();
    }
  };

  const clear = (): Promise<void> => {
    beginSessionReplacement();
    return takeTurn(removeSession);
  };

  const get = (): Promise<StoredCardSession | null> => takeTurn(readSession);

  /**
   * Records the provider app for the session that is about to be granted. The mirror is set before
   * the write, because the token exchange is the first request that has to reach the holder's own
   * tenant and it leaves while this store call is still in flight.
   */
  const setCardProviderAppId = (appId: string | null): Promise<void> => {
    recordProviderAppId(appId);
    /**
     * Recording a tenant starts a session replacement. The session on disk belongs to the tenant
     * being left, so it stops being current here: a snapshot taken before this call is stale, and
     * no later request can pair that token with the new routing. A login that then fails leaves the
     * holder signed out rather than signed in against a tenant it no longer names.
     */
    beginSessionReplacement();

    return takeTurn(async () => {
      if (appId === null) {
        await store.remove(CARD_SESSION_KEYS.providerAppId).catch(() => undefined);
        return;
      }

      await store.write(CARD_SESSION_KEYS.providerAppId, appId).catch(() => {
        // This process still routes on the mirror. Only a restart would read no tenant back, and
        // the login that follows it records the value again.
        console.warn("[card] the provider app id was not stored");
      });
    });
  };

  const isCardUsEnv = (usAppId: string): boolean => usAppId !== "" && providerAppId === usAppId;

  const getCardSessionToken = (): Promise<string | null> => readAccessToken();

  const readCardSession = async (): Promise<CardSessionSnapshot> => {
    const id = sessionId;
    await hydrateProviderAppId();
    const token = isCleared ? null : await store.read(CARD_SESSION_KEYS.accessToken);
    return { token, sessionId: id };
  };

  const isCardSessionCurrent = (requestSessionId: number): boolean =>
    !isCleared && requestSessionId === sessionId;

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

  const configureCardSessionRenewal = (config: CardSessionRenewalConfig): void => {
    renewal = config;
  };

  return {
    cardSession: { set, get, clear },
    setCardProviderAppId,
    isCardUsEnv,
    getCardSessionToken,
    readCardSession,
    isCardSessionCurrent,
    refreshCardSession,
    configureCardSessionRenewal,
  };
}
