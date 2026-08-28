import { cardManagementApi } from "@domain/api-card-management";
import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { cardApi, cardApiExtra, CARD_STALE_REQUEST } from "@shared/api-services";
import { createCardSession } from "./internals/createCardSession";
import type { CardSessionStore } from "./internals/sessionStore";
import type { CardRenewalDispatch } from "./types";

/**
 * The whole renewal, wired the way an app wires it: the real base query, the real grant, the real
 * session store, and an `onCardSessionEnded` that does what both apps do.
 *
 * The unit tests fake the grant. These do not: the point here is what a caller of a Card endpoint
 * sees when the renewal succeeds and when it ends the session.
 */

const BASE_URL = "https://card.test";
const TOKEN_PATH = "/v1/auth/oauth2/token";
const USER = {
  id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  verificationState: "VERIFIED",
};

function memoryStore(initial: Record<string, string> = {}): CardSessionStore {
  const slots = new Map(Object.entries(initial));
  return {
    read: async key => slots.get(key) ?? null,
    write: async (key, value) => {
      slots.set(key, value);
    },
    remove: async key => {
      slots.delete(key);
    },
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setup(store: CardSessionStore = memoryStore()) {
  const session = createCardSession(store);
  const onCardSessionEnded = jest.fn();

  const actions: UnknownAction[] = [];
  const record: Middleware = () => next => action => {
    actions.push(action as UnknownAction);
    return next(action);
  };

  const reduxStore = configureStore({
    reducer: { [cardApi.reducerPath]: cardApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cardApiExtra({
            cardApiBaseUrl: BASE_URL,
            cardBaanxClientKey: "client-key",
            readCardSession: session.readCardSession,
            refreshCardSession: session.refreshCardSession,
          }),
        },
      })
        .concat(cardApi.middleware)
        .concat(record),
  });

  session.configureCardSessionRenewal({
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    dispatch: reduxStore.dispatch as unknown as CardRenewalDispatch,
    onCardSessionEnded: () => {
      onCardSessionEnded();
      // Exactly what both apps do, including the deferral that keeps `resetApiState` from aborting
      // the request whose 401 started the renewal.
      setTimeout(() => reduxStore.dispatch(cardApi.util.resetApiState()), 0);
    },
  });

  return { session, store: reduxStore, actions, onCardSessionEnded };
}

/** Answers `/v1/user` and the token endpoint separately, so each test states both halves. */
function routeFetch(routes: { user: () => Response; token: () => Response }) {
  return jest.spyOn(globalThis, "fetch").mockImplementation(async input => {
    const url = input instanceof Request ? input.url : String(input);
    return url.endsWith(TOKEN_PATH) ? routes.token() : routes.user();
  });
}

/** The body the token endpoint received, so a test can name the token that was spent. */
function grantBody(spy: jest.SpyInstance): unknown {
  const call = spy.mock.calls.find(([input]) => String(input).endsWith(TOKEN_PATH));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const init = call?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body));
}

const flushTimers = () => new Promise(resolve => setTimeout(resolve, 0));

let fetchSpy: jest.SpyInstance | undefined;
let warn: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
  warn.mockRestore();
});

describe("the Card session renewal, end to end", () => {
  it("renews on a 401, rotates both tokens, and answers from the replay", async () => {
    let userCalls = 0;
    fetchSpy = routeFetch({
      user: () => (++userCalls === 1 ? json({ message: "unauthorized" }, 401) : json(USER)),
      token: () =>
        json({
          access_token: "at_new",
          expires_in: 3600,
          refresh_token: "rt_new",
        }),
    });
    const { session, store } = setup();
    await session.cardSession.set({
      accessToken: "at_old",
      refreshToken: "rt_old",
    });

    const request = store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    await expect(request.unwrap()).resolves.toEqual(USER);
    // The grant spent the stored refresh token, and both rotated tokens landed on disk.
    expect(grantBody(fetchSpy)).toEqual({
      grant_type: "refresh_token",
      refresh_token: "rt_old",
    });
    await expect(session.cardSession.get()).resolves.toEqual({
      accessToken: "at_new",
      refreshToken: "rt_new",
    });
  });

  it("answers the request that started a terminal renewal, instead of aborting it", async () => {
    fetchSpy = routeFetch({
      user: () => json({ message: "unauthorized" }, 401),
      token: () => json({ error: "invalid_grant" }, 400),
    });
    const { session, store, onCardSessionEnded } = setup();
    await session.cardSession.set({
      accessToken: "at_old",
      refreshToken: "rt_old",
    });

    const request = store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    // `onCardSessionEnded` empties the Card cache, which aborts every running query. Run
    // synchronously, it would abort this one: the aborted request resolves from the uninitialized
    // substate, so `unwrap()` would answer `undefined` and the login machine would read a signed-in
    // user over a wiped keychain.
    await expect(request.unwrap()).rejects.toMatchObject({ status: 401 });
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
    await expect(session.cardSession.get()).resolves.toBeNull();

    await flushTimers();
    expect(store.getState()[cardApi.reducerPath].queries).toEqual({});
  });

  it("ends the session when the token endpoint answers 5xx", async () => {
    fetchSpy = routeFetch({
      user: () => json({ message: "unauthorized" }, 401),
      token: () => json({ message: "upstream is down" }, 503),
    });
    const { session, store, onCardSessionEnded } = setup();
    await session.cardSession.set({
      accessToken: "at_old",
      refreshToken: "rt_old",
    });

    // One rule: a renewal that put no session on disk ends the session, whatever it answered. A
    // provider outage therefore signs the user out. See "Renewal" in the README.
    await expect(
      store.dispatch(cardManagementApi.endpoints.getUser.initiate()).unwrap(),
    ).rejects.toMatchObject({ status: 401 });
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
    await expect(session.cardSession.get()).resolves.toBeNull();
  });

  it("isolates a request whose session a new login replaced", async () => {
    fetchSpy = routeFetch({
      user: () => json({ message: "unauthorized" }, 401),
      token: () => json({ message: "never reached" }, 500),
    });
    const { session, store, onCardSessionEnded } = setup();
    await session.cardSession.set({
      accessToken: "at_old",
      refreshToken: "rt_old",
    });

    // The base query holds the old session id. The login lands before the 401 comes back.
    const stale = store.dispatch(cardManagementApi.endpoints.getUser.initiate());
    await session.cardSession.set({
      accessToken: "at_new",
      refreshToken: "rt_new",
    });

    // Not a 401: that would end the session the new login just started, for somebody else.
    await expect(stale.unwrap()).rejects.toEqual({
      status: "CUSTOM_ERROR",
      error: CARD_STALE_REQUEST,
    });
    expect(onCardSessionEnded).not.toHaveBeenCalled();
    await expect(session.cardSession.get()).resolves.toEqual({
      accessToken: "at_new",
      refreshToken: "rt_new",
    });
  });

  it("reports the read failure, and renews nothing, when the store cannot be read", async () => {
    fetchSpy = routeFetch({
      user: () => json(USER),
      token: () => json({}, 500),
    });
    const { store } = setup({
      read: async () => {
        throw new Error("the keychain is locked");
      },
      write: async () => undefined,
      remove: async () => undefined,
    });

    // A locked keychain is not an absent session, and an absent session ends one.
    await expect(
      store.dispatch(cardManagementApi.endpoints.getUser.initiate()).unwrap(),
    ).rejects.toEqual({
      status: "CUSTOM_ERROR",
      error: "the keychain is locked",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("puts no credential into any action it dispatches", async () => {
    let userCalls = 0;
    fetchSpy = routeFetch({
      user: () => (++userCalls === 1 ? json({ message: "unauthorized" }, 401) : json(USER)),
      token: () =>
        json({
          access_token: "at_sentinel",
          expires_in: 3600,
          refresh_token: "rt_sentinel",
        }),
    });
    const { session, store, actions } = setup();
    await session.cardSession.set({
      accessToken: "at_old",
      refreshToken: "rt_old",
    });

    await store.dispatch(cardManagementApi.endpoints.getUser.initiate()).unwrap();

    // Everything the desktop log export writes to disk and the mobile DevTools relay sends over a
    // socket. No sanitizer runs first, and none can: the relay takes none.
    const serialized = JSON.stringify(actions);
    expect(serialized).not.toContain("at_sentinel");
    expect(serialized).not.toContain("rt_sentinel");
    expect(serialized).not.toContain("at_old");
    expect(serialized).not.toContain("rt_old");
  });
});
