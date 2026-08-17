import { createCardSession } from "./createCardSession";
import { CARD_SESSION_KEYS, type CardSessionStore } from "./sessionStore";

const session = {
  accessToken: "at_token",
  expiresIn: 21600,
  refreshToken: "rt_token",
  refreshTokenExpiresIn: 15897600,
};

function fakeStore(initial: Record<string, string> = {}) {
  const slots = new Map(Object.entries(initial));
  const store: CardSessionStore = {
    read: jest.fn(async key => slots.get(key) ?? null),
    write: jest.fn(async (key, value) => {
      slots.set(key, value);
    }),
    remove: jest.fn(async key => {
      slots.delete(key);
    }),
  };
  return { store, slots };
}

describe("createCardSession", () => {
  it("starts without a session", async () => {
    const { cardSession, getCardSessionToken } = createCardSession(fakeStore().store);

    await expect(cardSession.get()).resolves.toBeNull();
    await expect(getCardSessionToken()).resolves.toBeNull();
  });

  it("stores each token under its own key", async () => {
    const { store, slots } = fakeStore();

    await createCardSession(store).cardSession.set(session);

    expect(Object.fromEntries(slots)).toEqual({
      [CARD_SESSION_KEYS.accessToken]: "at_token",
      [CARD_SESSION_KEYS.refreshToken]: "rt_token",
      [CARD_SESSION_KEYS.lifetimes]: JSON.stringify({
        expiresIn: 21600,
        refreshTokenExpiresIn: 15897600,
      }),
    });
  });

  it("reads back the session it stored", async () => {
    const { cardSession } = createCardSession(fakeStore().store);

    await cardSession.set(session);

    await expect(cardSession.get()).resolves.toEqual(session);
  });

  it("reads only the access token for the Authorization header", async () => {
    const { store } = fakeStore();
    const { getCardSessionToken, cardSession } = createCardSession(store);
    await cardSession.set(session);
    jest.mocked(store.read).mockClear();

    await expect(getCardSessionToken()).resolves.toBe("at_token");

    expect(store.read).toHaveBeenCalledTimes(1);
    expect(store.read).toHaveBeenCalledWith(CARD_SESSION_KEYS.accessToken);
  });

  it("writes the access token last, after the keys the request path never reads", async () => {
    const { store } = fakeStore();

    await createCardSession(store).cardSession.set(session);

    const written = jest.mocked(store.write).mock.calls.map(([key]) => key);
    expect(written.at(-1)).toBe(CARD_SESSION_KEYS.accessToken);
  });

  it("leaves no access token behind when a cold key cannot be written", async () => {
    const { store, slots } = fakeStore();
    jest.mocked(store.write).mockImplementation(async (key, value) => {
      if (key === CARD_SESSION_KEYS.refreshToken) {
        throw new Error("keychain full");
      }
      slots.set(key, value);
    });

    await expect(createCardSession(store).cardSession.set(session)).rejects.toThrow(
      "keychain full",
    );

    // A lone access token would send a Bearer for a session `get` reports as absent.
    expect(slots.has(CARD_SESSION_KEYS.accessToken)).toBe(false);
  });

  it("removes the keys it already wrote when the access token cannot be written", async () => {
    const { store, slots } = fakeStore();
    jest.mocked(store.write).mockImplementation(async (key, value) => {
      if (key === CARD_SESSION_KEYS.accessToken) {
        throw new Error("keychain full");
      }
      slots.set(key, value);
    });

    await expect(createCardSession(store).cardSession.set(session)).rejects.toThrow(
      "keychain full",
    );

    // The login is over, so the refresh token it wrote is a credential nothing will ever spend.
    expect(slots.size).toBe(0);
  });

  it("removes the cold key that landed when the other cold key fails", async () => {
    const { store, slots } = fakeStore();
    jest.mocked(store.write).mockImplementation(async (key, value) => {
      if (key === CARD_SESSION_KEYS.lifetimes) {
        throw new Error("keychain full");
      }
      slots.set(key, value);
    });

    await expect(createCardSession(store).cardSession.set(session)).rejects.toThrow(
      "keychain full",
    );

    // The refresh token is a credential too, so an aborted login may not leave it behind.
    expect(slots.size).toBe(0);
  });

  it("does not let a clear land between the two halves of a set", async () => {
    // The Card base query calls `refreshCardSession` on any 401, from outside the login machine, so
    // this interleaving is reachable: it would remove the cold keys and leave the access token alone.
    const { store, slots } = fakeStore();
    let releaseColdWrite = () => undefined as void;
    const coldWriteReached = new Promise<void>(resolve => {
      jest.mocked(store.write).mockImplementation(async (key, value) => {
        if (key === CARD_SESSION_KEYS.refreshToken) {
          resolve();
          await new Promise<void>(release => {
            releaseColdWrite = release;
          });
        }
        slots.set(key, value);
      });
    });
    const { cardSession } = createCardSession(store);

    const setting = cardSession.set(session);
    await coldWriteReached;
    const clearing = cardSession.clear();
    releaseColdWrite();
    await Promise.all([setting, clearing]);

    // The clear waited its turn, so it removed the whole session rather than half of it.
    expect(slots.size).toBe(0);
  });

  it("clears every key, the access token first", async () => {
    const { store, slots } = fakeStore();
    const { cardSession } = createCardSession(store);
    await cardSession.set(session);

    await cardSession.clear();

    expect(jest.mocked(store.remove).mock.calls[0][0]).toBe(CARD_SESSION_KEYS.accessToken);
    expect(slots.size).toBe(0);
    await expect(cardSession.get()).resolves.toBeNull();
  });

  it.each([
    ["the access token is missing", { [CARD_SESSION_KEYS.accessToken]: undefined }],
    ["the refresh token is missing", { [CARD_SESSION_KEYS.refreshToken]: undefined }],
    ["the lifetimes are missing", { [CARD_SESSION_KEYS.lifetimes]: undefined }],
  ])("reports no session when %s", async (_case, missing) => {
    const stored: Record<string, string> = {
      [CARD_SESSION_KEYS.accessToken]: "at_token",
      [CARD_SESSION_KEYS.refreshToken]: "rt_token",
      [CARD_SESSION_KEYS.lifetimes]: JSON.stringify({
        expiresIn: 1,
        refreshTokenExpiresIn: 2,
      }),
    };
    for (const key of Object.keys(missing)) {
      delete stored[key];
    }

    const { cardSession } = createCardSession(fakeStore(stored).store);

    await expect(cardSession.get()).resolves.toBeNull();
  });

  it.each(["not json at all", "null", '{"expiresIn":"soon"}'])(
    "reports no session when the lifetimes read %s",
    async lifetimes => {
      const { cardSession } = createCardSession(
        fakeStore({
          [CARD_SESSION_KEYS.accessToken]: "at_token",
          [CARD_SESSION_KEYS.refreshToken]: "rt_token",
          [CARD_SESSION_KEYS.lifetimes]: lifetimes,
        }).store,
      );

      await expect(cardSession.get()).resolves.toBeNull();
    },
  );

  it("never rejects when the store refuses to forget", async () => {
    const { store } = fakeStore();
    jest.mocked(store.remove).mockRejectedValue(new Error("keychain locked"));
    const { cardSession } = createCardSession(store);

    // The base query awaits this on a 401 without a try/catch; a rejection would lose the 401.
    await expect(cardSession.clear()).resolves.toBeUndefined();
  });

  it("stops serving the token after a clear the store refused", async () => {
    const { store } = fakeStore();
    const { cardSession, getCardSessionToken } = createCardSession(store);
    await cardSession.set(session);
    jest.mocked(store.remove).mockRejectedValue(new Error("keychain locked"));

    await cardSession.clear();

    // The value is still on disk, so only the cleared flag can keep the Bearer off the next request.
    await expect(getCardSessionToken()).resolves.toBeNull();
    await expect(cardSession.get()).resolves.toBeNull();
  });

  it("serves the token again after the next successful login", async () => {
    const { store } = fakeStore();
    const { cardSession, getCardSessionToken } = createCardSession(store);
    jest.mocked(store.remove).mockRejectedValue(new Error("keychain locked"));
    await cardSession.clear();

    await cardSession.set(session);

    await expect(getCardSessionToken()).resolves.toBe("at_token");
    await expect(cardSession.get()).resolves.toEqual(session);
  });
});

describe("refreshCardSession", () => {
  it("ends the session and reports that it cannot be renewed", async () => {
    const { store } = fakeStore();
    const { cardSession, refreshCardSession, getCardSessionToken } = createCardSession(store);
    await cardSession.set(session);

    await expect(refreshCardSession()).resolves.toBeNull();

    await expect(getCardSessionToken()).resolves.toBeNull();
  });
});
