import { cardManagementApi } from "@domain/api-card-management";
import { configureStore } from "@reduxjs/toolkit";
import {
  cardApi,
  cardApiExtra,
  CARD_RENEWAL_UNAVAILABLE,
  CARD_SESSION_ENDED,
} from "@shared/api-services";
import { createCardSession } from "./internals/createCardSession";
import type { CardSessionStore } from "./internals/sessionStore";
import {
  forgetCardAuthorizationGrant,
  forgetReceivedCardSessions,
  receiveCardSession,
  takeCardAuthorizationGrant,
} from "./sessionHandoff";
import type { CardRenewalDispatch } from "./types";

/**
 * The whole renewal, wired the way an app wires it: the real base query, the real grants, the real
 * session, and an `onCardSessionEnded` that does what both stores do.
 *
 * The unit tests above fake the grant. These do not: the point here is what a caller of a Card
 * endpoint sees when the renewal succeeds, when it ends the session, and when it cannot run.
 */

const BASE_URL = "https://card.test";
const USER = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" };

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

function setup() {
  const session = createCardSession(memoryStore());
  const onCardSessionEnded = jest.fn();

  const store = configureStore({
    reducer: { [cardApi.reducerPath]: cardApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cardApiExtra({
            cardApiBaseUrl: BASE_URL,
            cardBaanxClientKey: "client-key",
            readCardSession: session.readCardSession,
            getCardRefreshToken: session.getCardRefreshToken,
            takeCardAuthorizationGrant,
            receiveCardSession,
            refreshCardSession: session.refreshCardSession,
          }),
        },
      }).concat(cardApi.middleware),
  });

  session.configureCardSessionRenewal({
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    dispatch: store.dispatch as unknown as CardRenewalDispatch,
    onCardSessionEnded: () => {
      onCardSessionEnded();
      // Exactly what both apps do, including the deferral that keeps `resetApiState` from aborting
      // the request whose 401 started the renewal.
      setTimeout(() => store.dispatch(cardApi.util.resetApiState()), 0);
    },
  });

  return { session, store, onCardSessionEnded };
}

/** Answers `/v1/user` and the token endpoint separately, so each test states both halves. */
function routeFetch(routes: { user: () => Response; token: () => Response }) {
  return jest.spyOn(globalThis, "fetch").mockImplementation(async input => {
    const url = input instanceof Request ? input.url : String(input);
    return url.endsWith("/v1/auth/oauth2/token") ? routes.token() : routes.user();
  });
}

const flushTimers = () => new Promise(resolve => setTimeout(resolve, 0));

let fetchSpy: jest.SpyInstance | undefined;

beforeEach(() => {
  forgetReceivedCardSessions();
  forgetCardAuthorizationGrant();
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
});

describe("the Card session renewal, end to end", () => {
  it("renews on a 401 and answers the original request from the replay", async () => {
    let userCalls = 0;
    fetchSpy = routeFetch({
      user: () => (++userCalls === 1 ? json({ message: "unauthorized" }, 401) : json(USER)),
      token: () => json({ access_token: "at_new", expires_in: 3600, refresh_token: "rt_new" }),
    });
    const { session, store } = setup();
    await session.cardSession.set({ accessToken: "at_old", refreshToken: "rt_old" });

    const request = store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    await expect(request.unwrap()).resolves.toEqual(USER);
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
    await session.cardSession.set({ accessToken: "at_old", refreshToken: "rt_old" });

    const request = store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    // `onCardSessionEnded` empties the Card cache, which aborts every running query. Run
    // synchronously, it would abort this one: the aborted request resolves from the uninitialized
    // substate, so `unwrap()` would answer `undefined` and the login machine would read a signed-in
    // user over a wiped keychain.
    await expect(request.unwrap()).rejects.toMatchObject({
      status: 401,
      data: { message: CARD_SESSION_ENDED },
    });
    expect(onCardSessionEnded).toHaveBeenCalledTimes(1);
    await expect(session.cardSession.get()).resolves.toBeNull();

    await flushTimers();
    expect(store.getState()[cardApi.reducerPath].queries).toEqual({});
  });

  it("keeps the session when the token endpoint answers 5xx", async () => {
    fetchSpy = routeFetch({
      user: () => json({ message: "unauthorized" }, 401),
      token: () => json({ message: "upstream is down" }, 503),
    });
    const { session, store, onCardSessionEnded } = setup();
    await session.cardSession.set({ accessToken: "at_old", refreshToken: "rt_old" });

    const request = store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    // A 401 the owner could not judge. The login flow reads this body and keeps the session.
    await expect(request.unwrap()).rejects.toMatchObject({
      status: 401,
      data: { message: CARD_RENEWAL_UNAVAILABLE },
    });
    expect(onCardSessionEnded).not.toHaveBeenCalled();
    await expect(session.cardSession.get()).resolves.toEqual({
      accessToken: "at_old",
      refreshToken: "rt_old",
    });
  });

  it("keeps the session when a firewall answers the token endpoint with a 400 page", async () => {
    fetchSpy = routeFetch({
      user: () => json({ message: "unauthorized" }, 401),
      token: () =>
        new Response("<html>Blocked</html>", {
          status: 400,
          headers: { "content-type": "text/html" },
        }),
    });
    const { session, store, onCardSessionEnded } = setup();
    await session.cardSession.set({ accessToken: "at_old", refreshToken: "rt_old" });

    const request = store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    await expect(request.unwrap()).rejects.toMatchObject({
      status: 401,
      data: { message: CARD_RENEWAL_UNAVAILABLE },
    });
    expect(onCardSessionEnded).not.toHaveBeenCalled();
    await expect(session.getCardRefreshToken()).resolves.toBe("rt_old");
  });

  it("reports the read failure, and renews nothing, when the store cannot be read", async () => {
    fetchSpy = routeFetch({ user: () => json(USER), token: () => json({}, 500) });
    const failing: CardSessionStore = {
      read: async () => {
        throw new Error("the keychain is locked");
      },
      write: async () => undefined,
      remove: async () => undefined,
    };
    const session = createCardSession(failing);
    const store = configureStore({
      reducer: { [cardApi.reducerPath]: cardApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: cardApiExtra({
              cardApiBaseUrl: BASE_URL,
              cardBaanxClientKey: "client-key",
              readCardSession: session.readCardSession,
              getCardRefreshToken: session.getCardRefreshToken,
              takeCardAuthorizationGrant,
              receiveCardSession,
              refreshCardSession: session.refreshCardSession,
            }),
          },
        }).concat(cardApi.middleware),
    });

    const request = store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    // A locked keychain is not an absent session, and an absent session ends one.
    await expect(request.unwrap()).rejects.toEqual({
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
        json({ access_token: "at_sentinel", expires_in: 3600, refresh_token: "rt_sentinel" }),
    });
    const { session, store } = setup();
    await session.cardSession.set({ accessToken: "at_old", refreshToken: "rt_old" });

    const actions: unknown[] = [];
    const unsubscribe = store.subscribe(() => undefined);
    const originalDispatch = store.dispatch;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (store as { dispatch: unknown }).dispatch = ((action: unknown) => {
      actions.push(action);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return (originalDispatch as (value: unknown) => unknown)(action);
    }) as typeof store.dispatch;

    await store.dispatch(cardManagementApi.endpoints.getUser.initiate()).unwrap();
    unsubscribe();

    // Everything the desktop log export writes to disk and the mobile DevTools relay sends over a
    // socket, before any sanitizer runs.
    const serialized = JSON.stringify(actions);
    expect(serialized).not.toContain("at_sentinel");
    expect(serialized).not.toContain("rt_sentinel");
    expect(serialized).not.toContain("at_old");
    expect(serialized).not.toContain("rt_old");
  });
});
