import {
  forgetCardAuthorizationGrant,
  forgetReceivedCardSessions,
  receiveCardSession,
} from "../sessionHandoff";
import {
  CardSessionNotStoredError,
  type CardRenewalDispatch,
  type StoredCardSession,
} from "../types";
import { createCardSession } from "./createCardSession";
import { CARD_LEGACY_SESSION_KEYS, CARD_SESSION_KEYS, type CardSessionStore } from "./sessionStore";

const session: StoredCardSession = { accessToken: "at_token", refreshToken: "rt_token" };

/** What a renewal answers with. Every field differs, so a mixed read is visible. */
const renewedSession: StoredCardSession = {
  accessToken: "at_renewed",
  refreshToken: "rt_renewed",
};

/** The session a re-login writes over the top. */
const loginSession: StoredCardSession = { accessToken: "at_login", refreshToken: "rt_login" };

/** What the refresh grant answers with: a handle, never a token. */
function grantReceipt(answer: StoredCardSession = renewedSession) {
  return { sessionHandle: receiveCardSession(answer) };
}

function fakeStore(initial: Record<string, string> = {}) {
  const slots = new Map(Object.entries(initial));
  const writes: string[] = [];
  const store: CardSessionStore = {
    read: jest.fn(async key => slots.get(key) ?? null),
    write: jest.fn(async (key, value) => {
      writes.push(key);
      slots.set(key, value);
    }),
    remove: jest.fn(async key => {
      slots.delete(key);
    }),
  };
  return { store, slots, writes };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolveIt, rejectIt) => {
    resolve = resolveIt;
    reject = rejectIt;
  });
  // A rejection nobody has awaited yet must not warn.
  promise.catch(() => undefined);
  return { promise, resolve, reject };
}

type SetupOptions = {
  initial?: Record<string, string>;
  renew?: () => Promise<unknown>;
  install?: boolean;
};

/**
 * The renewal dispatches an RTK mutation and unwraps it. Only the unwrapped promise matters here, so
 * the fake dispatch answers with one and the real thunk is never run.
 */
function setup(options: SetupOptions = {}) {
  const { store, slots, writes } = fakeStore(options.initial);
  const renew = jest.fn<Promise<unknown>, []>(options.renew ?? (async () => grantReceipt()));
  const onCardSessionEnded = jest.fn();

  const dispatch = jest.fn(() => ({ unwrap: () => renew() }));
  const api = createCardSession(store);

  let dispose: (() => void) | undefined;
  if (options.install !== false) {
    dispose = api.configureCardSessionRenewal({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch: dispatch as unknown as CardRenewalDispatch,
      onCardSessionEnded,
    });
  }

  /** The epoch a request would have been sent with, as the base query reads it. */
  const epoch = async () => (await api.readCardSession()).epoch;

  /** What the base query does: read the session, then renew against the epoch it read. */
  const renewNow = async () => api.refreshCardSession(await epoch());

  return { ...api, store, slots, writes, renew, onCardSessionEnded, dispose, epoch, renewNow };
}

/** A live session already on disk. */
function liveSession(): Record<string, string> {
  return {
    [CARD_SESSION_KEYS.accessToken]: "at_token",
    [CARD_SESSION_KEYS.refreshToken]: "rt_token",
  };
}

beforeEach(() => {
  // The hand-off is module state, like the session store itself.
  forgetReceivedCardSessions();
  forgetCardAuthorizationGrant();
});

describe("createCardSession storage", () => {
  it("starts without a session", async () => {
    const { cardSession, getCardSessionToken } = setup();

    await expect(cardSession.get()).resolves.toBeNull();
    await expect(getCardSessionToken()).resolves.toBeNull();
  });

  it("stores each token under its own key, as it received them", async () => {
    const { cardSession, slots } = setup();

    await cardSession.set(session);

    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_token");
    expect(slots.get(CARD_SESSION_KEYS.refreshToken)).toBe("rt_token");
  });

  it("writes the refresh token before the access token", async () => {
    const { cardSession, writes } = setup();

    await cardSession.set(session);

    expect(writes).toEqual([CARD_SESSION_KEYS.refreshToken, CARD_SESSION_KEYS.accessToken]);
  });

  it("keeps only the two tokens, whatever else the caller hands over", async () => {
    const { cardSession, slots } = setup();

    // The login machine passes a whole `PayCardSession`. Its lifetime is not ours to keep.
    await cardSession.set({ ...session, expiresIn: 3600 } as StoredCardSession);

    expect([...slots.keys()].sort()).toEqual(
      [CARD_SESSION_KEYS.accessToken, CARD_SESSION_KEYS.refreshToken].sort(),
    );
  });

  it("removes every key on a clear", async () => {
    const { cardSession, slots } = setup({ initial: liveSession() });

    await cardSession.clear();

    expect(slots.size).toBe(0);
  });

  it("removes the keys an earlier build left behind", async () => {
    const legacyKey = CARD_LEGACY_SESSION_KEYS[0];
    const { cardSession, store } = setup({
      initial: { ...liveSession(), [legacyKey]: "stale" },
    });

    await cardSession.clear();

    // Nothing reads that key any more, so a logout is the only chance to take it off the device.
    expect(store.remove).toHaveBeenCalledWith(legacyKey);
  });

  it("removes every key, the refresh token included, when the access write fails", async () => {
    const { store, slots } = fakeStore();
    jest.mocked(store.write).mockImplementation(async (key, value) => {
      if (key === CARD_SESSION_KEYS.accessToken) {
        throw new Error("the keychain refused to store the token");
      }
      slots.set(key, value);
    });

    await expect(createCardSession(store).cardSession.set(session)).rejects.toThrow(
      "the keychain refused",
    );
    expect(slots.size).toBe(0);
  });

  it("reports a write that a clear replaced, instead of reporting success", async () => {
    const write = deferred<void>();
    const { store, slots } = fakeStore();
    jest.mocked(store.write).mockImplementation(async (key, value) => {
      slots.set(key, value);
      if (key === CARD_SESSION_KEYS.refreshToken) {
        await write.promise;
      }
    });
    const api = createCardSession(store);

    const stored = api.cardSession.set(session);
    await Promise.resolve();
    // The clear bumps the generation while the write is between its two keys.
    const cleared = api.cardSession.clear();
    write.resolve();

    // Reported as success, this would send the login machine on with no Bearer to send.
    await expect(stored).rejects.toBeInstanceOf(CardSessionNotStoredError);
    await cleared;
    expect(slots.size).toBe(0);
  });

  it("reads back both halves", async () => {
    const { cardSession } = setup();

    await cardSession.set(session);

    await expect(cardSession.get()).resolves.toEqual(session);
  });

  it("reports no session when either half is missing", async () => {
    const withoutRefresh = setup({
      initial: { [CARD_SESSION_KEYS.accessToken]: "at_token" },
    });
    const withoutAccess = setup({
      initial: { [CARD_SESSION_KEYS.refreshToken]: "rt_token" },
    });

    await expect(withoutRefresh.cardSession.get()).resolves.toBeNull();
    await expect(withoutAccess.cardSession.get()).resolves.toBeNull();
  });

  it("lets a store read failure travel, rather than passing it off as no session", async () => {
    const { store } = fakeStore();
    jest.mocked(store.read).mockRejectedValue(new Error("the keychain is locked"));
    const api = createCardSession(store);

    // An absent session ends one. A keychain the OS refused says nothing about a session.
    await expect(api.getCardSessionToken()).rejects.toThrow("the keychain is locked");
    await expect(api.readCardSession()).rejects.toThrow("the keychain is locked");
  });
});

describe("createCardSession readers", () => {
  it("serves the stored access token without renewing", async () => {
    const { getCardSessionToken, renew } = setup({ initial: liveSession() });

    await expect(getCardSessionToken()).resolves.toBe("at_token");
    // A renewal starts from a 401, never from a read.
    expect(renew).not.toHaveBeenCalled();
  });

  it("serves the access token with the epoch of the session it came from", async () => {
    const { readCardSession, cardSession } = setup({ initial: liveSession() });

    const first = await readCardSession();
    expect(first).toEqual({ token: "at_token", epoch: expect.any(Number) });

    await cardSession.set(loginSession);

    const second = await readCardSession();
    expect(second.token).toBe("at_login");
    expect(second.epoch).toBeGreaterThan(first.epoch);
  });

  it("serves the refresh token to the renewal endpoint without renewing", async () => {
    const { getCardRefreshToken, renew, cardSession } = setup({ initial: liveSession() });

    await expect(getCardRefreshToken()).resolves.toBe("rt_token");
    expect(renew).not.toHaveBeenCalled();

    await cardSession.clear();
    await expect(getCardRefreshToken()).resolves.toBeNull();
  });

  it("serves nothing once the session is cleared", async () => {
    const { getCardSessionToken, cardSession } = setup({ initial: liveSession() });

    await cardSession.clear();

    await expect(getCardSessionToken()).resolves.toBeNull();
  });
});

describe("createCardSession renewal", () => {
  it("renews and stores the new session", async () => {
    const { renewNow, slots } = setup({ initial: liveSession() });

    await expect(renewNow()).resolves.toEqual({
      kind: "refreshed",
      accessToken: "at_renewed",
    });
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_renewed");
    expect(slots.get(CARD_SESSION_KEYS.refreshToken)).toBe("rt_renewed");
  });

  it("reads the refresh token once, through the grant", async () => {
    const { renewNow, store } = setup({ initial: liveSession() });
    jest.mocked(store.read).mockClear();

    await renewNow();

    // The grant reads the key off `extra`. A second read here would be a second native call, and
    // the two could disagree.
    const refreshReads = jest
      .mocked(store.read)
      .mock.calls.filter(([key]) => key === CARD_SESSION_KEYS.refreshToken);
    expect(refreshReads).toHaveLength(0);
  });

  it("spends the refresh token once, because the first failure ended the session", async () => {
    const { renewNow, renew, slots } = setup({
      initial: liveSession(),
      renew: async () => {
        throw { status: 500, data: { message: "upstream" } };
      },
    });

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);

    // The session is over, so a later caller holding the same epoch is told so, and no second grant
    // goes out. Baanx rotates the refresh token on every use; one failure must not spend two.
    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(renew).toHaveBeenCalledTimes(1);
  });

  it("ends the session on a refresh token the provider already consumed", async () => {
    const { renewNow, slots, onCardSessionEnded } = setup({
      initial: liveSession(),
      renew: async () => {
        throw { status: 400, data: { error: "invalid_grant" } };
      },
    });

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("ends the session when the grant reports no refresh token to spend", async () => {
    const { renewNow, slots } = setup({
      initial: { [CARD_SESSION_KEYS.accessToken]: "at_token" },
      renew: async () => {
        throw { status: 401, data: { message: "missing_refresh_token" } };
      },
    });

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);
  });
});

describe("createCardSession concurrency", () => {
  it("serves many concurrent 401s from one renewal", async () => {
    const { refreshCardSession, renew, epoch } = setup({ initial: liveSession() });
    const current = await epoch();

    const results = await Promise.all([
      refreshCardSession(current),
      refreshCardSession(current),
      refreshCardSession(current),
      refreshCardSession(current),
      refreshCardSession(current),
    ]);

    expect(renew).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array(5).fill({ kind: "refreshed", accessToken: "at_renewed" }));
  });

  it("starts a new renewal once the shared one has settled", async () => {
    const { renewNow, renew } = setup({ initial: liveSession() });

    await renewNow();
    await renewNow();

    expect(renew).toHaveBeenCalledTimes(2);
  });

  it("joins an in-flight renewal instead of starting a second one", async () => {
    const pending = deferred<unknown>();
    const { refreshCardSession, renew, epoch } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });
    const current = await epoch();

    const first = refreshCardSession(current);
    await Promise.resolve();
    const second = refreshCardSession(current);

    pending.resolve(grantReceipt());

    await expect(first).resolves.toMatchObject({ kind: "refreshed" });
    await expect(second).resolves.toMatchObject({ kind: "refreshed" });
    expect(renew).toHaveBeenCalledTimes(1);
  });
});

describe("createCardSession generation", () => {
  it("lets a clear beat a renewal that is already in flight", async () => {
    const pending = deferred<unknown>();
    const { cardSession, refreshCardSession, slots, epoch } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const renewal = refreshCardSession(await epoch());
    await Promise.resolve();
    const cleared = cardSession.clear();

    pending.resolve(grantReceipt());

    // The request that asked belonged to the session the user just ended. Nothing is replayed.
    await expect(renewal).resolves.toEqual({ kind: "session-replaced" });
    await cleared;
    expect(slots.size).toBe(0);
  });

  it("never replays an old request with a new login's token", async () => {
    const pending = deferred<unknown>();
    const { cardSession, refreshCardSession, slots, epoch } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const renewal = refreshCardSession(await epoch());
    await Promise.resolve();
    const login = cardSession.set(loginSession);

    pending.resolve(grantReceipt());

    // The new token belongs to whoever just signed in. Handing it to the previous session's
    // request would replay that request as the new user.
    await expect(renewal).resolves.toEqual({ kind: "session-replaced" });
    await login;
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_login");
    expect(slots.get(CARD_SESSION_KEYS.refreshToken)).toBe("rt_login");
  });

  it("neither renews nor clears for a request that outlived its session", async () => {
    const { cardSession, refreshCardSession, renew, slots, onCardSessionEnded, epoch } = setup({
      initial: liveSession(),
    });
    const stale = await epoch();

    await cardSession.set(loginSession);

    await expect(refreshCardSession(stale)).resolves.toEqual({ kind: "session-replaced" });
    expect(renew).not.toHaveBeenCalled();
    expect(onCardSessionEnded).not.toHaveBeenCalled();
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_login");
  });

  it("never clears a new login's session because an old one died", async () => {
    const pending = deferred<unknown>();
    const { cardSession, refreshCardSession, slots, onCardSessionEnded, epoch } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const renewal = refreshCardSession(await epoch());
    await Promise.resolve();
    await cardSession.set(loginSession);

    pending.reject({ status: 400, data: { error: "invalid_grant" } });

    await expect(renewal).resolves.toEqual({ kind: "session-replaced" });
    expect(onCardSessionEnded).not.toHaveBeenCalled();
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_login");
  });

  it("tells a request from a session that terminal cleanup ended that it ended", async () => {
    const { refreshCardSession, epoch } = setup({
      initial: liveSession(),
      renew: async () => {
        throw { status: 401, data: { message: "unauthorized" } };
      },
    });
    const current = await epoch();

    await expect(refreshCardSession(current)).resolves.toEqual({ kind: "session-ended" });
    // A second request that was in flight at the same time asks with the same epoch.
    await expect(refreshCardSession(current)).resolves.toEqual({ kind: "session-ended" });
  });
});

describe("createCardSession terminal cleanup", () => {
  it("runs once for concurrent terminal outcomes", async () => {
    const { refreshCardSession, onCardSessionEnded, epoch } = setup({
      initial: liveSession(),
      renew: async () => {
        throw { status: 401, data: { message: "invalid_grant" } };
      },
    });
    const current = await epoch();

    await Promise.all([
      refreshCardSession(current),
      refreshCardSession(current),
      refreshCardSession(current),
    ]);

    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("finishes even when the store refuses every removal", async () => {
    const { store } = fakeStore(liveSession());
    jest.mocked(store.remove).mockRejectedValue(new Error("the keychain is locked"));
    const onCardSessionEnded = jest.fn();
    const api = createCardSession(store);
    api.configureCardSessionRenewal({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch: jest.fn(() => ({
        unwrap: () => Promise.reject({ status: 401, data: { message: "invalid_grant" } }),
      })) as unknown as CardRenewalDispatch,
      onCardSessionEnded,
    });

    const { epoch } = await api.readCardSession();
    await expect(api.refreshCardSession(epoch)).resolves.toEqual({ kind: "session-ended" });
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
    // The values are still on disk, and nothing will serve them again this process.
    await expect(api.getCardSessionToken()).resolves.toBeNull();
  });

  it("survives an onCardSessionEnded that throws", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { store } = fakeStore(liveSession());
    const api = createCardSession(store);
    api.configureCardSessionRenewal({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch: jest.fn(() => ({
        unwrap: () => Promise.reject({ status: 401, data: { message: "invalid_grant" } }),
      })) as unknown as CardRenewalDispatch,
      onCardSessionEnded: () => {
        throw new Error("the store refused to reset");
      },
    });

    const { epoch } = await api.readCardSession();
    await expect(api.refreshCardSession(epoch)).resolves.toEqual({ kind: "session-ended" });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("answers a later 401 from the cleared flag, with no network call", async () => {
    const { cardSession, renewNow, renew } = setup({ initial: liveSession() });

    await cardSession.clear();

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(renew).not.toHaveBeenCalled();
  });

  it("ends the session when a renewed session cannot be stored", async () => {
    // The provider no longer accepts the old refresh token, so a session that cannot be written
    // leaves nothing to use.
    const { store, slots } = fakeStore(liveSession());
    jest.mocked(store.write).mockRejectedValue(new Error("the keychain refused the token"));
    const onCardSessionEnded = jest.fn();
    const api = createCardSession(store);
    api.configureCardSessionRenewal({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch: jest.fn(() => ({
        unwrap: async () => grantReceipt(),
      })) as unknown as CardRenewalDispatch,
      onCardSessionEnded,
    });

    const { epoch } = await api.readCardSession();
    await expect(api.refreshCardSession(epoch)).resolves.toEqual({ kind: "session-ended" });
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
    expect(slots.size).toBe(0);
  });
});

describe("createCardSession failure policy", () => {
  // One rule: a renewal that ran and did not produce a session ends the session. No status is read,
  // and no body is read. See "Renewal" in the README for the trade this makes.
  const terminal = [
    { name: "a rejected grant", error: { status: 400, data: { error: "invalid_grant" } } },
    { name: "a rejected client", error: { status: 400, data: { error: "invalid_client" } } },
    { name: "an unauthorized grant", error: { status: 401, data: { message: "unauthorized" } } },
    { name: "a malformed request", error: { status: 400, data: { error: "invalid_request" } } },
    { name: "a 400 that names no reason", error: { status: 400 } },
    {
      name: "a proxy error page over a 400",
      error: { status: 400, data: "<html>Blocked by the network</html>" },
    },
    { name: "a validation error", error: { status: 422, data: { message: "x is not allowed" } } },
    { name: "an invalid client key", error: { status: 498, data: { message: "invalid key" } } },
    { name: "a missing client key", error: { status: 499, data: { message: "no key" } } },
    { name: "a request timeout", error: { status: 408, data: { message: "timeout" } } },
    { name: "rate limiting", error: { status: 429, data: { message: "slow down" } } },
    { name: "an upstream failure", error: { status: 500, data: { message: "boom" } } },
    { name: "a parse failure over a 500", error: { status: "PARSING_ERROR", originalStatus: 500 } },
    { name: "a lost response", error: { status: "FETCH_ERROR", error: "network down" } },
    { name: "a timeout", error: { status: "TIMEOUT_ERROR", error: "too slow" } },
    {
      name: "a schema failure over a 200",
      error: { status: "CUSTOM_ERROR", error: "PayCardSessionResponseSchema validation failed" },
    },
    {
      name: "a serialized error",
      error: { name: "TypeError", message: "undefined is not a function" },
    },
    { name: "nothing at all", error: undefined },
  ];

  it.each(terminal)("ends the session after $name", async ({ error }) => {
    const { renewNow, slots, onCardSessionEnded } = setup({
      initial: liveSession(),
      renew: async () => {
        throw error;
      },
    });

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("ends the session when the hand-off holds no session for the handle", async () => {
    // The grant succeeded, so Baanx rotated the refresh token. The stored one is spent, and the new
    // one went with the hand-off, so there is nothing left to renew with.
    const { renewNow, slots } = setup({
      initial: liveSession(),
      renew: async () => ({ sessionHandle: "card-session-never-stored" }),
    });

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);
  });

  it("carries no part of the answer into its result", async () => {
    const { renewNow } = setup({
      initial: liveSession(),
      renew: async () => {
        throw { status: 500, data: { message: "boom", token: "sensitive-token" } };
      },
    });

    const result = await renewNow();

    expect(result).toEqual({ kind: "session-ended" });
    expect(JSON.stringify(result)).not.toContain("sensitive-token");
  });

  it("keeps the session when no renewal is installed", async () => {
    // The one answer that is not terminal: no request was made, so nothing was learned. A wiring
    // mistake must not sign every user out.
    const { renewNow, slots, onCardSessionEnded } = setup({
      initial: liveSession(),
      install: false,
    });

    await expect(renewNow()).resolves.toEqual({
      kind: "unavailable",
      reason: "card session renewal is not configured",
    });
    expect(slots.size).toBeGreaterThan(0);
    expect(onCardSessionEnded).not.toHaveBeenCalled();
  });

  it("keeps the session once the renewal is uninstalled", async () => {
    const { renewNow, dispose, slots } = setup({ initial: liveSession() });

    dispose?.();

    await expect(renewNow()).resolves.toMatchObject({ kind: "unavailable" });
    expect(slots.size).toBeGreaterThan(0);
  });
});
