import {
  CardSessionNotStoredError,
  type CardRenewalDispatch,
  type StoredCardSession,
} from "../types";
import { createCardSession } from "./createCardSession";
import { CARD_SESSION_KEYS, type CardSessionStore } from "./sessionStore";

const session: StoredCardSession = {
  accessToken: "at_token",
  refreshToken: "rt_token",
};

const renewedSession: StoredCardSession = {
  accessToken: "at_renewed",
  refreshToken: "rt_renewed",
};

const loginSession: StoredCardSession = {
  accessToken: "at_login",
  refreshToken: "rt_login",
};

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
  promise.catch(() => undefined);
  return { promise, resolve, reject };
}

function logText(spy: jest.SpyInstance): string {
  return spy.mock.calls.flat().map(String).join(" ");
}

type SetupOptions = {
  initial?: Record<string, string>;
  renew?: () => Promise<StoredCardSession>;
  install?: boolean;
};

function setup(options: SetupOptions = {}) {
  const { store, slots, writes } = fakeStore(options.initial);
  const renew = jest.fn<Promise<StoredCardSession>, []>(
    options.renew ?? (async () => renewedSession),
  );
  const onCardSessionEnded = jest.fn();

  const dispatch = jest.fn(() => ({ unwrap: renew }));
  const api = createCardSession(store);

  if (options.install !== false) {
    api.configureCardSessionRenewal({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch: dispatch as unknown as CardRenewalDispatch,
      onCardSessionEnded,
    });
  }

  const snapshot = () => api.readCardSession();
  const sessionId = async () => (await snapshot()).sessionId;

  const renewNow = async () => {
    const current = await snapshot();
    return api.refreshCardSession(current.sessionId, current.token ?? "at_token");
  };

  return {
    ...api,
    store,
    slots,
    writes,
    renew,
    onCardSessionEnded,
    snapshot,
    sessionId,
    renewNow,
  };
}

function liveSession(): Record<string, string> {
  return {
    [CARD_SESSION_KEYS.accessToken]: "at_token",
    [CARD_SESSION_KEYS.refreshToken]: "rt_token",
  };
}

let warn: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  warn.mockRestore();
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

  it("removes every key on a clear, the ones an earlier build left behind included", async () => {
    const { cardSession, slots } = setup({
      initial: {
        ...liveSession(),
        [CARD_SESSION_KEYS.lifetimes]: "an older build wrote this",
      },
    });

    await cardSession.clear();

    expect(slots.size).toBe(0);
  });

  it("removes every key, the refresh token included, when the access write fails", async () => {
    const { store, slots } = fakeStore();
    jest
      .mocked(store.write)
      .mockImplementationOnce(async (key, value) => {
        slots.set(key, value);
      })
      .mockRejectedValueOnce(new Error("the keychain refused the token"));
    const api = createCardSession(store);

    await expect(api.cardSession.set(session)).rejects.toThrow("the keychain refused the token");
    expect(slots.size).toBe(0);
  });

  it("reports a write that a clear replaced, instead of reporting success", async () => {
    const { store, slots } = fakeStore();
    const blocked = deferred<void>();
    jest.mocked(store.write).mockImplementationOnce(async (key, value) => {
      slots.set(key, value);
      await blocked.promise;
    });
    const api = createCardSession(store);

    const written = api.cardSession.set(session);
    const cleared = api.cardSession.clear();
    blocked.resolve();

    await expect(written).rejects.toBeInstanceOf(CardSessionNotStoredError);
    await cleared;
    expect(slots.size).toBe(0);
  });

  it("reports no session when either half is missing", async () => {
    const accessOnly = setup({
      initial: { [CARD_SESSION_KEYS.accessToken]: "at_token" },
    });
    const refreshOnly = setup({
      initial: { [CARD_SESSION_KEYS.refreshToken]: "rt_token" },
    });

    await expect(accessOnly.cardSession.get()).resolves.toBeNull();
    await expect(refreshOnly.cardSession.get()).resolves.toBeNull();
  });

  it("lets a store read failure travel, rather than passing it off as no session", async () => {
    const { store } = fakeStore();
    jest.mocked(store.read).mockRejectedValue(new Error("the keychain is locked"));
    const api = createCardSession(store);

    await expect(api.getCardSessionToken()).rejects.toThrow("the keychain is locked");
  });
});

describe("createCardSession readers", () => {
  it("serves the access token with the session id of the session it came from", async () => {
    const { cardSession, readCardSession } = setup();

    await cardSession.set(session);
    const first = await readCardSession();

    await cardSession.set(loginSession);
    const second = await readCardSession();

    expect(first).toEqual({ token: "at_token", sessionId: expect.any(Number) });
    expect(second.token).toBe("at_login");
    expect(second.sessionId).toBeGreaterThan(first.sessionId);
  });

  it("serves no credential until a replacement session is fully stored", async () => {
    const { store, slots } = fakeStore(liveSession());
    const writeStarted = deferred<void>();
    const releaseWrite = deferred<void>();
    jest.mocked(store.write).mockImplementation(async (key, value) => {
      if (key === CARD_SESSION_KEYS.refreshToken) {
        writeStarted.resolve();
        await releaseWrite.promise;
      }
      slots.set(key, value);
    });
    const api = createCardSession(store);
    const previous = await api.readCardSession();

    const login = api.cardSession.set(loginSession);
    await writeStarted.promise;
    const replacing = await api.readCardSession();

    expect(replacing.token).toBeNull();
    expect(replacing.sessionId).toBeGreaterThan(previous.sessionId);
    expect(api.isCardSessionCurrent(previous.sessionId)).toBe(false);
    expect(api.isCardSessionCurrent(replacing.sessionId)).toBe(false);

    releaseWrite.resolve();
    await login;
    expect(await api.readCardSession()).toEqual({
      token: "at_login",
      sessionId: replacing.sessionId,
    });
    expect(api.isCardSessionCurrent(replacing.sessionId)).toBe(true);
  });

  it("hides a cleared session before its queued removals start", async () => {
    const { cardSession, readCardSession, isCardSessionCurrent } = setup({
      initial: liveSession(),
    });
    const previous = await readCardSession();

    const clearing = cardSession.clear();
    const cleared = await readCardSession();

    expect(cleared.token).toBeNull();
    expect(cleared.sessionId).toBeGreaterThan(previous.sessionId);
    expect(isCardSessionCurrent(previous.sessionId)).toBe(false);
    expect(isCardSessionCurrent(cleared.sessionId)).toBe(false);
    await clearing;
  });

  it("answers nothing for a read that a clear overtook", async () => {
    const { store, slots } = fakeStore(liveSession());
    const readStarted = deferred<void>();
    const releaseRead = deferred<void>();
    jest.mocked(store.read).mockImplementation(async key => {
      const held = slots.get(key) ?? null;
      readStarted.resolve();
      await releaseRead.promise;
      return held;
    });
    const api = createCardSession(store);

    const reading = api.getCardSessionToken();
    await readStarted.promise;
    const clearing = api.cardSession.clear();
    releaseRead.resolve();

    await expect(reading).resolves.toBeNull();
    await clearing;
  });

  it("answers nothing for a read that a new login overtook", async () => {
    const { store, slots } = fakeStore(liveSession());
    const readStarted = deferred<void>();
    const releaseRead = deferred<void>();
    jest.mocked(store.read).mockImplementation(async key => {
      const held = slots.get(key) ?? null;
      readStarted.resolve();
      await releaseRead.promise;
      return held;
    });
    const api = createCardSession(store);

    const reading = api.getCardSessionToken();
    await readStarted.promise;
    await api.cardSession.set(loginSession);
    releaseRead.resolve();

    await expect(reading).resolves.toBeNull();
    await expect(api.getCardSessionToken()).resolves.toBe("at_login");
  });

  it("serves nothing once the session is cleared, even from a store that kept the value", async () => {
    const { cardSession, getCardSessionToken, store, slots } = setup({
      initial: liveSession(),
    });
    jest.mocked(store.remove).mockRejectedValue(new Error("the keychain is locked"));

    await cardSession.clear();

    expect(slots.size).toBeGreaterThan(0);
    await expect(getCardSessionToken()).resolves.toBeNull();
    await expect(cardSession.get()).resolves.toBeNull();
  });
});

describe("createCardSession renewal", () => {
  it("renews, and stores both rotated tokens", async () => {
    const { renewNow, slots } = setup({ initial: liveSession() });

    await expect(renewNow()).resolves.toEqual({
      kind: "refreshed",
      accessToken: "at_renewed",
    });
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_renewed");
    expect(slots.get(CARD_SESSION_KEYS.refreshToken)).toBe("rt_renewed");
  });

  it("reads the refresh token itself, and hands it to the grant", async () => {
    const { renewNow, store } = setup({ initial: liveSession() });
    jest.mocked(store.read).mockClear();

    await renewNow();

    expect(store.read).toHaveBeenCalledWith(CARD_SESSION_KEYS.refreshToken);
  });

  it("serves many concurrent 401s from one renewal", async () => {
    const { refreshCardSession, renew, sessionId, store } = setup({
      initial: liveSession(),
    });
    const current = await sessionId();
    jest.mocked(store.read).mockClear();

    const results = await Promise.all(
      Array.from({ length: 5 }, () => refreshCardSession(current, "at_token")),
    );

    expect(renew).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array(5).fill({ kind: "refreshed", accessToken: "at_renewed" }));
    expect(
      jest.mocked(store.read).mock.calls.filter(([key]) => key === CARD_SESSION_KEYS.accessToken),
    ).toHaveLength(1);
  });

  it("joins an in-flight renewal instead of starting a second one", async () => {
    const pending = deferred<StoredCardSession>();
    const { refreshCardSession, renew, sessionId } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });
    const current = await sessionId();

    const first = refreshCardSession(current, "at_token");
    await Promise.resolve();
    const second = refreshCardSession(current, "at_token");
    pending.resolve(renewedSession);

    expect(second).toBe(first);
    await expect(first).resolves.toMatchObject({ kind: "refreshed" });
    await expect(second).resolves.toMatchObject({ kind: "refreshed" });
    expect(renew).toHaveBeenCalledTimes(1);
  });

  it("starts a new renewal once the shared one has settled", async () => {
    const { renewNow, renew } = setup({ initial: liveSession() });

    await renewNow();
    await renewNow();

    expect(renew).toHaveBeenCalledTimes(2);
  });

  it("reuses the rotated token for a delayed 401 sent with the previous token", async () => {
    const { refreshCardSession, snapshot, renew } = setup({
      initial: liveSession(),
    });
    const requestSession = await snapshot();

    await expect(
      refreshCardSession(requestSession.sessionId, requestSession.token ?? ""),
    ).resolves.toMatchObject({ kind: "refreshed", accessToken: "at_renewed" });
    await expect(
      refreshCardSession(requestSession.sessionId, requestSession.token ?? ""),
    ).resolves.toEqual({ kind: "refreshed", accessToken: "at_renewed" });

    expect(renew).toHaveBeenCalledTimes(1);
  });

  it("rechecks a different failed token after the active refresh settles", async () => {
    const { refreshCardSession, sessionId, renew } = setup({ initial: liveSession() });
    const current = await sessionId();

    const staleToken = refreshCardSession(current, "at_stale");
    const currentToken = refreshCardSession(current, "at_token");

    await expect(staleToken).resolves.toEqual({
      kind: "refreshed",
      accessToken: "at_token",
    });
    await expect(currentToken).resolves.toEqual({
      kind: "refreshed",
      accessToken: "at_renewed",
    });
    expect(renew).toHaveBeenCalledTimes(1);
  });
});

describe("createCardSession renewal failures", () => {
  const failures = [
    {
      name: "a grant the provider refused",
      options: {
        initial: liveSession(),
        renew: async () => {
          throw new Error("the Card request failed: the provider answered 400");
        },
      },
    },
    {
      name: "a session that holds no refresh token",
      options: { initial: { [CARD_SESSION_KEYS.accessToken]: "at_token" } },
    },
  ];

  it.each(failures)(
    "ends the session and publishes signed-out after $name",
    async ({ options }) => {
      const { renewNow, slots, onCardSessionEnded } = setup(options);

      await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
      expect(slots.size).toBe(0);
      expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalled();
    },
  );

  it("ends the session when the app installed no renewal", async () => {
    const { renewNow, slots } = setup({
      initial: liveSession(),
      install: false,
    });

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);
    expect(warn).toHaveBeenCalled();
  });

  it("ends the session when a renewed session cannot be stored", async () => {
    const { renewNow, store, slots, onCardSessionEnded } = setup({
      initial: liveSession(),
    });
    jest.mocked(store.write).mockRejectedValue(new Error("the keychain refused the token"));

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(slots.size).toBe(0);
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("carries no part of the failure into its answer", async () => {
    const { renewNow } = setup({
      initial: liveSession(),
      renew: async () => {
        throw new Error("sensitive-token");
      },
    });

    const result = await renewNow();

    expect(result).toEqual({ kind: "session-ended" });
    expect(JSON.stringify(result)).not.toContain("sensitive-token");
    expect(logText(warn)).not.toContain("sensitive-token");
  });

  it("spends the refresh token once, because the first failure ended the session", async () => {
    const { renewNow, renew } = setup({
      initial: liveSession(),
      renew: async () => {
        throw new Error("the provider answered 500");
      },
    });

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(renew).toHaveBeenCalledTimes(1);
  });

  it("finishes even when the store refuses every removal", async () => {
    const { renewNow, store, getCardSessionToken, onCardSessionEnded } = setup({
      initial: liveSession(),
      renew: async () => {
        throw new Error("the provider answered 400");
      },
    });
    jest.mocked(store.remove).mockRejectedValue(new Error("the keychain is locked"));

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
    await expect(getCardSessionToken()).resolves.toBeNull();
  });

  it("survives an onCardSessionEnded that throws", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { store, slots } = fakeStore(liveSession());
    const api = createCardSession(store);
    api.configureCardSessionRenewal({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch: jest.fn(() => ({
        unwrap: () => Promise.reject(new Error("the provider answered 400")),
      })) as unknown as CardRenewalDispatch,
      onCardSessionEnded: () => {
        throw new Error("the store refused to reset");
      },
    });

    const { sessionId } = await api.readCardSession();

    await expect(api.refreshCardSession(sessionId, "at_token")).resolves.toEqual({
      kind: "session-ended",
    });
    expect(slots.size).toBe(0);
    expect(consoleError).toHaveBeenCalled();
    expect(logText(consoleError)).not.toContain("store refused to reset");
    consoleError.mockRestore();
  });
});

describe("createCardSession session id", () => {
  it("lets a logout beat a renewal that is already in flight", async () => {
    const pending = deferred<StoredCardSession>();
    const { cardSession, refreshCardSession, slots, sessionId } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const renewal = refreshCardSession(await sessionId(), "at_token");
    await Promise.resolve();
    const cleared = cardSession.clear();
    pending.resolve(renewedSession);

    await expect(renewal).resolves.toEqual({ kind: "session-replaced" });
    await cleared;
    expect(slots.size).toBe(0);
  });

  it("never replays an old request with a new login's token", async () => {
    const pending = deferred<StoredCardSession>();
    const { cardSession, refreshCardSession, slots, sessionId } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const renewal = refreshCardSession(await sessionId(), "at_token");
    await Promise.resolve();
    const login = cardSession.set(loginSession);
    pending.resolve(renewedSession);

    await expect(renewal).resolves.toEqual({ kind: "session-replaced" });
    await login;
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_login");
    expect(slots.get(CARD_SESSION_KEYS.refreshToken)).toBe("rt_login");
  });

  it("never clears a new login's session because an old one died", async () => {
    const pending = deferred<StoredCardSession>();
    const { cardSession, refreshCardSession, slots, onCardSessionEnded, sessionId } = setup({
      initial: liveSession(),
      renew: () => pending.promise,
    });

    const renewal = refreshCardSession(await sessionId(), "at_token");
    await Promise.resolve();
    await cardSession.set(loginSession);
    pending.reject(new Error("the provider answered 400"));

    await expect(renewal).resolves.toEqual({ kind: "session-replaced" });
    expect(onCardSessionEnded).not.toHaveBeenCalled();
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_login");
  });

  it("neither renews nor clears for a request that outlived its session", async () => {
    const { cardSession, refreshCardSession, renew, slots, onCardSessionEnded, sessionId } = setup({
      initial: liveSession(),
    });
    const stale = await sessionId();

    await cardSession.set(loginSession);

    await expect(refreshCardSession(stale, "at_token")).resolves.toEqual({
      kind: "session-replaced",
    });
    expect(renew).not.toHaveBeenCalled();
    expect(onCardSessionEnded).not.toHaveBeenCalled();
    expect(slots.get(CARD_SESSION_KEYS.accessToken)).toBe("at_login");
  });

  it("renews nothing and clears nothing for a request whose session is already over", async () => {
    const { refreshCardSession, renew, sessionId, onCardSessionEnded } = setup({
      initial: liveSession(),
      renew: async () => {
        throw new Error("the provider answered 401");
      },
    });
    const current = await sessionId();

    await expect(refreshCardSession(current, "at_token")).resolves.toEqual({
      kind: "session-ended",
    });

    await expect(refreshCardSession(current, "at_token")).resolves.toEqual({
      kind: "session-replaced",
    });
    expect(renew).toHaveBeenCalledTimes(1);
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("answers a later 401 from the cleared flag, with no grant at all", async () => {
    const { cardSession, renewNow, renew } = setup({ initial: liveSession() });

    await cardSession.clear();

    await expect(renewNow()).resolves.toEqual({ kind: "session-ended" });
    expect(renew).not.toHaveBeenCalled();
  });
});
