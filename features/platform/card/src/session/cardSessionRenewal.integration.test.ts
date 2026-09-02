import { cardManagementApi } from "@domain/api-card-management";
import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import {
  cardApi,
  cardApiExtra,
  CARD_STALE_REQUEST,
  redactCardApiAction,
} from "@shared/api-services";
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
            getCardApiBaseUrl: () => BASE_URL,
            getCardBaanxClientKey: () => "client-key",
            readCardSession: session.readCardSession,
            isCardSessionCurrent: session.isCardSessionCurrent,
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
function routeFetch(routes: {
  user: () => Response | Promise<Response>;
  token: () => Response | Promise<Response>;
}) {
  return jest.spyOn(globalThis, "fetch").mockImplementation(async input => {
    const url = input instanceof Request ? input.url : String(input);
    return url.endsWith(TOKEN_PATH) ? routes.token() : routes.user();
  });
}

/** The body the token endpoint received, so a test can name the token that was spent. */
async function grantBody(spy: jest.SpyInstance): Promise<unknown> {
  const call = spy.mock.calls.find(([input]) => String(input?.url ?? input).endsWith(TOKEN_PATH));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const sent = call?.[0] as Request;
  return sent.json();
}

const flushTimers = () => new Promise(resolve => setTimeout(resolve, 0));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolveIt => {
    resolve = resolveIt;
  });
  return { promise, resolve };
}

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
    await expect(grantBody(fetchSpy)).resolves.toEqual({
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

  it("discards a successful response from a session that a new login replaced", async () => {
    const userRequested = deferred<void>();
    const oldUserResponse = deferred<Response>();
    fetchSpy = routeFetch({
      user: () => {
        userRequested.resolve();
        return oldUserResponse.promise;
      },
      token: () => json({ message: "never reached" }, 500),
    });
    const { session, store } = setup();
    await session.cardSession.set({
      accessToken: "at_old",
      refreshToken: "rt_old",
    });

    const stale = store.dispatch(cardManagementApi.endpoints.getUser.initiate());
    await userRequested.promise;
    await session.cardSession.set({
      accessToken: "at_new",
      refreshToken: "rt_new",
    });
    oldUserResponse.resolve(json(USER));

    await expect(stale.unwrap()).rejects.toEqual({
      status: "CUSTOM_ERROR",
      error: CARD_STALE_REQUEST,
    });
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
      error: "Card session read failed",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps every credential out of the actions a logger or DevTools reads", async () => {
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

    // A grant is an endpoint, so its argument rides on the pending action and its answer on the
    // fulfilled one. The desktop logger, the desktop DevTools and the mobile DevTools relay each
    // read an action only after this redaction.
    const serialized = JSON.stringify(actions.map(action => redactCardApiAction(action)));
    expect(serialized).not.toContain("at_sentinel");
    expect(serialized).not.toContain("rt_sentinel");
    expect(serialized).not.toContain("at_old");
    expect(serialized).not.toContain("rt_old");
    // The renewal still reads as a renewal.
    expect(serialized).toContain("refreshSession");
  });

  it("keeps the rotated tokens out of the store, because the grant runs untracked", async () => {
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
    const { session, store } = setup();
    await session.cardSession.set({ accessToken: "at_old", refreshToken: "rt_old" });

    await store.dispatch(cardManagementApi.endpoints.getUser.initiate()).unwrap();

    // The one copy of a Card session is the one in the session store.
    expect(JSON.stringify(store.getState())).not.toContain("at_sentinel");
    expect(JSON.stringify(store.getState())).not.toContain("rt_sentinel");
  });
});
