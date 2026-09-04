import { cardManagementApi } from "@domain/api-card-management";
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

    await store.remove(CARD_SESSION_KEYS.accessToken).catch(() => undefined);
    await store.remove(CARD_SESSION_KEYS.refreshToken).catch(() => undefined);
    await store.remove(CARD_SESSION_KEYS.lifetimes).catch(() => undefined);
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

      return outcome === "written"
        ? { kind: "refreshed", accessToken: session.accessToken }
        : { kind: "session-replaced" };
    } catch {
      return endIfCurrent(requestSessionId);
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

  const getCardSessionToken = (): Promise<string | null> => readAccessToken();

  const readCardSession = async (): Promise<CardSessionSnapshot> => {
    const id = sessionId;
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
    getCardSessionToken,
    readCardSession,
    isCardSessionCurrent,
    refreshCardSession,
    configureCardSessionRenewal,
  };
}
