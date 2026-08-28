import type { CardRenewalDispatch, StoredCardSession } from "../types";
import { createCardSession } from "./createCardSession";
import { CARD_SESSION_KEYS, type CardSessionStore } from "./sessionStore";

const session: StoredCardSession = { accessToken: "at_token", refreshToken: "rt_token" };

/** What a renewal answers with. Every field differs, so a mixed read is visible. */
const renewedSession: StoredCardSession = {
  accessToken: "at_renewed",
  refreshToken: "rt_renewed",
};

/** The session a re-login writes over the top. */
const loginSession: StoredCardSession = { accessToken: "at_login", refreshToken: "rt_login" };

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
  const renew = jest.fn<Promise<unknown>, []>(options.renew ?? (async () => renewedSession));
  const onCardSessionEnded = jest.fn();

  const dispatch = jest.fn(() => ({ unwrap: () => renew() }));
  const api = createCardSession(store);

  if (options.install !== false) {
    api.configureCardSessionRenewal({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch: dispatch as unknown as CardRenewalDispatch,
      onCardSessionEnded,
    });
  }

  return { ...api, store, slots, writes, renew, onCardSessionEnded };
}

/** A live session already on disk. */
function liveSession(): Record<string, string> {
  return {
    [CARD_SESSION_KEYS.accessToken]: "at_token",
    [CARD_SESSION_KEYS.refreshToken]: "rt_token",
  };
}

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
});

describe("createCardSession readers", () => {
  it("serves the stored access token without renewing", async () => {
    const { getCardSessionToken, renew } = setup({ initial: liveSession() });

    await expect(getCardSessionToken()).resolves.toBe("at_token");
    // A renewal starts from a 401, never from a read.
    expect(renew).not.toHaveBeenCalled();
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
    const { refreshCardSession, slots } = setup({ initial: liveSession() });

    await expect(refreshCardSession()).resolves.toEqual({
      kind: "refreshed",
      accessToken: "at_renewed",
    });
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_renewed");
    expect(slots.get(CARD_SESSION_KEYS.refreshToken)).toBe("rt_renewed");
  });

  it("tries again on the next 401 after a nonterminal failure", async () => {
    let fail = true;
    const { refreshCardSession, renew } = setup({
      initial: liveSession(),
      renew: async () => {
        if (fail) {
          throw { status: 500, data: { message: "upstream" } };
        }
        return renewedSession;
      },
    });

    await expect(refreshCardSession()).resolves.toMatchObject({ kind: "unavailable" });
    fail = false;

    // Nothing may remember the failure: a 401 is now the only way in, so a memo would wedge the
    // session until the next login.
    await expect(refreshCardSession()).resolves.toMatchObject({ kind: "refreshed" });
    expect(renew).toHaveBeenCalledTimes(2);
  });

  it("ends the session on a refresh token the provider already consumed", async () => {
    const { refreshCardSession, slots, onCardSessionEnded } = setup({
      initial: liveSession(),
      renew: async () => {
        throw { status: 400, data: { message: "invalid_grant" } };
      },
    });

    await expect(refreshCardSession()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("ends the session when there is no refresh token to spend", async () => {
    const { refreshCardSession, renew } = setup({
      initial: { [CARD_SESSION_KEYS.accessToken]: "at_token" },
    });

    await expect(refreshCardSession()).resolves.toEqual({ kind: "session-ended" });
    expect(renew).not.toHaveBeenCalled();
  });
});

describe("createCardSession concurrency", () => {
  it("serves many concurrent 401s from one renewal", async () => {
    const { refreshCardSession, renew } = setup({ initial: liveSession() });

    const results = await Promise.all([
      refreshCardSession(),
      refreshCardSession(),
      refreshCardSession(),
      refreshCardSession(),
      refreshCardSession(),
    ]);

    expect(renew).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array(5).fill({ kind: "refreshed", accessToken: "at_renewed" }));
  });

  it("starts a new renewal once the shared one has settled", async () => {
    const { refreshCardSession, renew } = setup({ initial: liveSession() });

    await refreshCardSession();
    await refreshCardSession();

    expect(renew).toHaveBeenCalledTimes(2);
  });

  it("joins an in-flight renewal instead of starting a second one", async () => {
    const pending = deferred<unknown>();
    const { refreshCardSession, renew } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const first = refreshCardSession();
    await Promise.resolve();
    const second = refreshCardSession();

    pending.resolve(renewedSession);

    await expect(first).resolves.toMatchObject({ kind: "refreshed" });
    await expect(second).resolves.toMatchObject({ kind: "refreshed" });
    expect(renew).toHaveBeenCalledTimes(1);
  });
});

describe("createCardSession generation", () => {
  it("lets a clear beat a renewal that is already in flight", async () => {
    const pending = deferred<unknown>();
    const { cardSession, refreshCardSession, slots } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const renewal = refreshCardSession();
    await Promise.resolve();
    const cleared = cardSession.clear();

    pending.resolve(renewedSession);

    await expect(renewal).resolves.toEqual({ kind: "session-ended" });
    await cleared;
    expect(slots.size).toBe(0);
  });

  it("lets a login beat a renewal, and reports the login's token", async () => {
    const pending = deferred<unknown>();
    const { cardSession, refreshCardSession, slots } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const renewal = refreshCardSession();
    await Promise.resolve();
    const login = cardSession.set(loginSession);

    pending.resolve(renewedSession);

    await expect(renewal).resolves.toEqual({ kind: "refreshed", accessToken: "at_login" });
    await login;
    expect(slots.get(CARD_SESSION_KEYS.refreshToken)).toBe("rt_login");
  });
});

describe("createCardSession terminal cleanup", () => {
  it("runs once for concurrent terminal outcomes", async () => {
    const { refreshCardSession, onCardSessionEnded } = setup({
      initial: liveSession(),
      renew: async () => {
        throw { status: 401, data: { message: "invalid_grant" } };
      },
    });

    await Promise.all([refreshCardSession(), refreshCardSession(), refreshCardSession()]);

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

    await expect(api.refreshCardSession()).resolves.toEqual({ kind: "session-ended" });
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

    await expect(api.refreshCardSession()).resolves.toEqual({ kind: "session-ended" });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("answers a later 401 from the cleared flag, with no network call", async () => {
    const { cardSession, refreshCardSession, renew } = setup({ initial: liveSession() });

    await cardSession.clear();

    await expect(refreshCardSession()).resolves.toEqual({ kind: "session-ended" });
    expect(renew).not.toHaveBeenCalled();
  });

  it("ends the session when a renewed session cannot be stored", async () => {
    // The old refresh token is already spent, so a session that cannot be written is unrecoverable.
    const { store, slots } = fakeStore(liveSession());
    jest.mocked(store.write).mockRejectedValue(new Error("the keychain refused the token"));
    const onCardSessionEnded = jest.fn();
    const api = createCardSession(store);
    api.configureCardSessionRenewal({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch: jest.fn(() => ({
        unwrap: async () => renewedSession,
      })) as unknown as CardRenewalDispatch,
      onCardSessionEnded,
    });

    await expect(api.refreshCardSession()).resolves.toEqual({ kind: "session-ended" });
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
    expect(slots.size).toBe(0);
  });
});

describe("createCardSession failure policy", () => {
  const nonterminal = [
    { name: "a lost response", error: { status: "FETCH_ERROR", error: "network down" } },
    { name: "a timeout", error: { status: "TIMEOUT_ERROR", error: "too slow" } },
    { name: "a request timeout", error: { status: 408, data: { message: "timeout" } } },
    { name: "rate limiting", error: { status: 429, data: { message: "slow down" } } },
    { name: "an upstream failure", error: { status: 500, data: { message: "boom" } } },
    { name: "a parse failure over a 500", error: { status: "PARSING_ERROR", originalStatus: 500 } },
    {
      name: "a serialized error",
      error: { name: "TypeError", message: "undefined is not a function" },
    },
  ];

  it.each(nonterminal)("keeps the session after $name", async ({ error }) => {
    const { refreshCardSession, slots, onCardSessionEnded } = setup({
      initial: liveSession(),
      renew: async () => {
        throw error;
      },
    });

    await expect(refreshCardSession()).resolves.toMatchObject({ kind: "unavailable" });
    expect(slots.size).toBeGreaterThan(0);
    expect(onCardSessionEnded).not.toHaveBeenCalled();
  });

  const terminal = [
    { name: "a rejected grant", error: { status: 400, data: { message: "invalid_grant" } } },
    { name: "an unauthorized grant", error: { status: 401, data: { message: "unauthorized" } } },
    { name: "a parse failure over a 400", error: { status: "PARSING_ERROR", originalStatus: 400 } },
  ];

  it.each(terminal)("ends the session after $name", async ({ error }) => {
    const { refreshCardSession, slots } = setup({
      initial: liveSession(),
      renew: async () => {
        throw error;
      },
    });

    await expect(refreshCardSession()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);
  });

  it("keeps the session when the renewal answers with no session", async () => {
    const { refreshCardSession, slots } = setup({
      initial: liveSession(),
      renew: async () => ({ accessToken: "at_only" }),
    });

    await expect(refreshCardSession()).resolves.toMatchObject({ kind: "unavailable" });
    expect(slots.get(CARD_SESSION_KEYS.refreshToken)).toBe("rt_token");
  });

  it("carries a status and a message, and never the response body", async () => {
    const { refreshCardSession } = setup({
      initial: liveSession(),
      renew: async () => {
        throw { status: 500, data: { message: "boom", token: "sensitive-token" } };
      },
    });

    const result = await refreshCardSession();

    expect(result).toEqual({
      kind: "unavailable",
      error: { status: 500, message: "the card session renewal failed" },
    });
    expect(JSON.stringify(result)).not.toContain("sensitive-token");
  });

  it("stays nonterminal when no renewal is installed", async () => {
    const { refreshCardSession, slots } = setup({ initial: liveSession(), install: false });

    await expect(refreshCardSession()).resolves.toEqual({
      kind: "unavailable",
      error: { message: "card session renewal is not configured" },
    });
    expect(slots.size).toBeGreaterThan(0);
  });
});
