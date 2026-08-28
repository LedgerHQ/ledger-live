import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { cardApi, cardApiExtra, type CardApiExtra } from "@shared/api-services";
import {
  cardManagementApi,
  useFreezeCardMutation,
  useGetCardLinkedWalletsQuery,
  useGetCardOnboardingStatusQuery,
  useGetCardStatusQuery,
  useLazyGetCardStatusQuery,
  useGetInternalWalletsQuery,
  useOrderCardMutation,
  useUnfreezeCardMutation,
} from "./api";
import { MISSING_AUTHORIZATION_GRANT, MISSING_REFRESH_TOKEN } from "./constants";
import { PayCardErrorResponseSchema } from "./schema";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify(PayCardErrorResponseSchema.parse({ message })), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * The refetch an invalidation triggers only reaches `fetch` a tick later: the base query awaits the
 * session token first. Drain the queue before counting requests, so the assertion does not depend on
 * how many microtasks the awaited dispatch happened to spend.
 */
function flushPendingRequests(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/** Records every dispatched action, so a test can assert on what a logger would see. */
function recordActions(sink: { type: string; meta?: unknown }[]): Middleware {
  return () => next => action => {
    sink.push(action as { type: string });
    return next(action);
  };
}

function request(spy: jest.SpyInstance): Request {
  return spy.mock.calls[0][0] as Request;
}

const sessionResponse = {
  access_token: "at_token",
  expires_in: 21600,
  refresh_token: "rt_token",
};

const session = {
  accessToken: "at_token",
  expiresIn: 21600,
  refreshToken: "rt_token",
};

// The provider's own example response.
const cardStatus = {
  id: "000000000050277836",
  holderName: "JOHN DOE",
  expiryDate: "2028/01",
  panLast4: "1234",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2023-03-27T17:07:12.662Z",
};

// The provider's own example responses, as they arrive on the wire.
const internalWalletsOnTheWire = [
  {
    id: "098aeb90-e7f7-4f81-bc2e-4963330122c5",
    balance: "125.50",
    currency: "xrp",
    address: "rNxp4h8apvRis6mJf9Sh8C6iRxfrDWN7AA",
    addressMemo: "78",
    addressId: "0x0a4b21fa733e9aeaddbf070302a85c559de13c4c",
    type: "INTERNAL",
  },
  {
    id: "7c1839ee-918e-4787-b74f-deeb48ead58b",
    balance: "500.00",
    currency: "usdc",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    addressMemo: null,
    addressId: "7c1839ee-918e-4787-b74f-deeb48ead58b",
    type: "INTERNAL",
  },
];

const internalWallets = internalWalletsOnTheWire.map(
  ({ addressId: _addressId, type: _type, ...wallet }) => wallet,
);

const linkedWallets = [
  {
    id: "1693a6da-5945-4461-ba1c-0b9891f78848",
    address: "DfKNsYfrCEHb7ScJkuMTtPTeDiyjmBBm9NMHnbR7uFHz",
    currency: "sol",
    network: "solana",
    priority: 1,
  },
  {
    id: "7c1839ee-918e-4787-b74f-deeb48ead58b",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    currency: "usdc",
    network: "ethereum",
    priority: 2,
  },
];

/** The hand-off both grants use, as `@features/platform-card` implements it. */
function fakeHandoff() {
  const received: Record<string, unknown> = {};
  let grant: { code: string; codeVerifier: string } | null = null;
  let counter = 0;
  return {
    received,
    putGrant(next: { code: string; codeVerifier: string }) {
      grant = next;
    },
    takeCardAuthorizationGrant: () => {
      const taken = grant;
      grant = null;
      return taken;
    },
    receiveCardSession: (value: unknown) => {
      counter += 1;
      const handle = `card-session-${counter}`;
      received[handle] = value;
      return handle;
    },
  };
}

// Wired the way the apps wire it: the store registers the service api, never this package.
const makeStore = (
  sessionToken: string | null = null,
  overrides: Partial<CardApiExtra> = {},
  extraMiddleware: Middleware[] = [],
) => {
  const handoff = fakeHandoff();
  const store = configureStore({
    reducer: {
      [cardManagementApi.reducerPath]: cardManagementApi.reducer,
    },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cardApiExtra({
            getCardApiBaseUrl: () => "https://card.test",
            getCardBaanxClientKey: () => "client-key",
            readCardSession: () => Promise.resolve({ token: sessionToken, epoch: 1 }),
            getCardRefreshToken: () => Promise.resolve("rt_token"),
            takeCardAuthorizationGrant: handoff.takeCardAuthorizationGrant,
            receiveCardSession: handoff.receiveCardSession,
            refreshCardSession: () =>
              Promise.resolve({
                kind: "unavailable",
                error: { message: "no renewal configured" },
              }),
            ...overrides,
          }),
        },
      })
        .concat(cardApi.middleware)
        .concat(extraMiddleware),
  });
  return Object.assign(store, { handoff });
};

describe("cardManagementApi configuration", () => {
  it("is the Card service api, mutated in place by injectEndpoints", () => {
    expect(cardManagementApi).toBe(cardApi);
    expect(cardManagementApi.reducerPath).toBe("cardApi");
  });

  it("injects exactly its own endpoints", () => {
    expect(Object.keys(cardManagementApi.endpoints).sort()).toEqual([
      "exchangeAuthorizationCode",
      "freezeCard",
      "getCardLinkedWallets",
      "getCardOnboardingStatus",
      "getCardStatus",
      "getInternalWallets",
      "getUser",
      "logout",
      "orderCard",
      "refreshSession",
      "unfreezeCard",
    ]);
  });

  it("exposes the orderCard endpoint and its hook", () => {
    expect(cardManagementApi.endpoints.orderCard).toBeDefined();
    expect(useOrderCardMutation).toBeDefined();
  });

  it("exposes the getCardStatus endpoint and its hook", () => {
    expect(cardManagementApi.endpoints.getCardStatus).toBeDefined();
    expect(useGetCardStatusQuery).toBeDefined();
    // The devtool fetches on press, not on mount, so the lazy hook is part of the surface too.
    expect(useLazyGetCardStatusQuery).toBeDefined();
  });

  it("exposes the freeze endpoints and their hooks", () => {
    expect(cardManagementApi.endpoints.freezeCard).toBeDefined();
    expect(useFreezeCardMutation).toBeDefined();
    expect(cardManagementApi.endpoints.unfreezeCard).toBeDefined();
    expect(useUnfreezeCardMutation).toBeDefined();
  });

  it("exposes the wallet endpoints and their hooks", () => {
    expect(cardManagementApi.endpoints.getInternalWallets).toBeDefined();
    expect(useGetInternalWalletsQuery).toBeDefined();
    expect(cardManagementApi.endpoints.getCardLinkedWallets).toBeDefined();
    expect(useGetCardLinkedWalletsQuery).toBeDefined();
  });

  it("exposes the onboarding status endpoint and its hook", () => {
    expect(cardManagementApi.endpoints.getCardOnboardingStatus).toBeDefined();
    expect(useGetCardOnboardingStatusQuery).toBeDefined();
  });

  it("shares the Card service reducer and middleware once registered in a store", () => {
    const store = makeStore();

    expect(store.getState()).toHaveProperty(cardManagementApi.reducerPath);
  });
});

describe("cardManagementApi requests", () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe("exchangeAuthorizationCode", () => {
    it("posts the grant it took off the extra, and hands the session over out of band", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore();
      store.handoff.putGrant({ code: "auth-code", codeVerifier: "verifier" });
      const result = await store.dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate(),
      );

      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/oauth2/token");
      expect(request(fetchSpy).method).toBe("POST");
      expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
        grant_type: "authorization_code",
        code: "auth-code",
        code_verifier: "verifier",
      });
      // The answer is a handle. The session went to its owner, not into the action.
      expect(result.data).toEqual({ sessionHandle: "card-session-1" });
      expect(store.handoff.received["card-session-1"]).toEqual(session);
    });

    it("puts neither the grant nor the session into any action", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const actions: { type: string; meta?: unknown }[] = [];
      const store = makeStore(null, {}, [recordActions(actions)]);
      store.handoff.putGrant({ code: "auth-code", codeVerifier: "sensitive-verifier" });

      await store.dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate(undefined, {
          track: false,
        }),
      );

      // Everything the desktop log export and the mobile DevTools relay would serialize.
      const serialized = JSON.stringify(actions);
      expect(serialized).not.toContain("sensitive-verifier");
      expect(serialized).not.toContain("auth-code");
      expect(serialized).not.toContain("at_token");
      expect(serialized).not.toContain("rt_token");
      expect(serialized).toContain("exchangeAuthorizationCode");
    });

    it("answers a wiring error when the caller put no grant in the slot", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore();
      const result = await store.dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate(),
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.error).toEqual({
        status: "CUSTOM_ERROR",
        error: MISSING_AUTHORIZATION_GRANT,
      });
    });

    it("does not expose tokens when the response is malformed", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          ...sessionResponse,
          access_token: "sensitive-access-token",
          refresh_token: "sensitive-refresh-token",
          expires_in: "invalid",
        }),
      );

      const store = makeStore();
      store.handoff.putGrant({ code: "auth-code", codeVerifier: "verifier" });
      const result = await store.dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate(),
      );
      const serializedError = JSON.stringify(result.error);

      expect(result.data).toBeUndefined();
      expect(serializedError).not.toContain("sensitive-access-token");
      expect(serializedError).not.toContain("sensitive-refresh-token");
    });
  });

  describe("refreshSession", () => {
    it("reuses the token endpoint with the refresh_token grant, read off the extra", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));
      const getCardRefreshToken = jest.fn(async () => "rt_token");

      const store = makeStore(null, { getCardRefreshToken });
      const result = await store.dispatch(cardManagementApi.endpoints.refreshSession.initiate());

      // Once, and only here: the renewal itself never reads the key.
      expect(getCardRefreshToken).toHaveBeenCalledTimes(1);
      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/oauth2/token");
      expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
        grant_type: "refresh_token",
        refresh_token: "rt_token",
      });
      expect(result.data).toEqual({ sessionHandle: "card-session-1" });
      expect(store.handoff.received["card-session-1"]).toEqual(session);
    });

    it("puts no token into any action, argument or payload", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const actions: { type: string; meta?: unknown }[] = [];
      const store = makeStore("session-token", {}, [recordActions(actions)]);

      await store.dispatch(
        cardManagementApi.endpoints.refreshSession.initiate(undefined, { track: false }),
      );

      // Everything the desktop log export writes to disk and the mobile DevTools relay sends over
      // a socket. The grant takes its credential off the extra and answers with a handle.
      const serialized = JSON.stringify(actions);
      expect(serialized).not.toContain("rt_token");
      expect(serialized).not.toContain("at_token");
      expect(serialized).not.toContain("session-token");
      expect(serialized).toContain("refreshSession");
      expect(serialized).toContain("card-session-1");
    });

    it("sends no Authorization header, even with a live session", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore("session-token");
      await store.dispatch(cardManagementApi.endpoints.refreshSession.initiate());

      expect(request(fetchSpy).headers.get("authorization")).toBeNull();
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
    });

    it("answers 401 and sends nothing when no refresh token is stored", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore(null, { getCardRefreshToken: async () => null });
      const result = await store.dispatch(cardManagementApi.endpoints.refreshSession.initiate());

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.error).toEqual({
        status: 401,
        data: { message: MISSING_REFRESH_TOKEN },
      });
    });

    it("answers a nonterminal error when the store read rejects", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore(null, {
        getCardRefreshToken: async () => {
          throw new Error("keychain unavailable");
        },
      });
      const result = await store.dispatch(cardManagementApi.endpoints.refreshSession.initiate());

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.error).toEqual({ status: "CUSTOM_ERROR", error: "keychain unavailable" });
    });

    it("never renews on its own 401, so a dead refresh token cannot loop", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async () => errorResponse(401, "invalid_grant"));
      const refreshCardSession = jest.fn(async () => ({
        kind: "refreshed" as const,
        accessToken: "should-not-be-used",
      }));

      const store = makeStore(null, { refreshCardSession });
      const result = await store.dispatch(cardManagementApi.endpoints.refreshSession.initiate());

      expect(refreshCardSession).not.toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.error).toMatchObject({ status: 401 });
    });

    it("does not expose tokens when the response does not match the wire contract", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          access_token: "sensitive-access-token",
          refresh_token: "sensitive-refresh-token",
          // `expires_in` is missing, so the wire schema rejects the body.
        }),
      );

      const store = makeStore();
      const result = await store.dispatch(cardManagementApi.endpoints.refreshSession.initiate());
      const serializedError = JSON.stringify(result.error);

      expect(result.data).toBeUndefined();
      expect(serializedError).toContain("PayCardSessionResponseSchema");
      expect(serializedError).not.toContain("sensitive-access-token");
      expect(serializedError).not.toContain("sensitive-refresh-token");
    });
  });

  describe("logout", () => {
    it("omits the bearer token when no session is open", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));

      const store = makeStore();
      await store.dispatch(cardManagementApi.endpoints.logout.initiate());

      expect(request(fetchSpy).headers.get("authorization")).toBeNull();
    });

    it("sends the session bearer token alongside the client key", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.logout.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/logout");
      expect(request(fetchSpy).method).toBe("POST");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(result.data).toEqual({ success: true });
    });
  });

  describe("getUser", () => {
    it("keeps the personal data the endpoint returns out of the cache", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
          verificationState: "VERIFIED",
          firstName: "Ada",
          lastName: "Lovelace",
          dateOfBirth: "1815-12-10",
          email: "ada@example.com",
          phoneNumber: "0100000000",
          addressLine1: "1 Main St",
          city: "London",
          zip: "SW1A",
          ssn: "000-00-0000",
        }),
      );

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getUser.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/user");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(result.data).toEqual({
        id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        verificationState: "VERIFIED",
      });
    });
  });

  describe("orderCard", () => {
    it("posts a virtual card order with the session bearer token and the client key", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.orderCard.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/card/order");
      expect(request(fetchSpy).method).toBe("POST");
      expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({ type: "VIRTUAL" });
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(result.data).toEqual({ success: true });
    });

    it("rejects a response whose success flag is not a boolean", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse({ success: "yes" }));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.orderCard.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("getCardStatus", () => {
    it("reads the card and drops everything the wire contract does not declare", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(cardStatus));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getCardStatus.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/card/status");
      expect(request(fetchSpy).method).toBe("GET");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(result.data).toEqual(cardStatus);
    });

    it("reports a user who never ordered a card as a 404", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(errorResponse(404, "Card not found"));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getCardStatus.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({ status: 404 });
    });

    it("rejects a status the wire contract does not name", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse({ ...cardStatus, status: "SOMETHING_ELSE" }));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getCardStatus.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it("refetches after an order, because the order invalidates the card status", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (input: RequestInfo | URL) =>
          new URL((input as Request).url).pathname === "/v1/card/order"
            ? jsonResponse({ success: true })
            : jsonResponse(cardStatus),
        );

      const store = makeStore("session-token");
      // Subscribed, so the invalidation has a live cache entry to refetch.
      const status = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await status;
      await store.dispatch(cardManagementApi.endpoints.orderCard.initiate());
      await flushPendingRequests();

      const statusRequests = fetchSpy.mock.calls.filter(
        ([input]) => new URL((input as Request).url).pathname === "/v1/card/status",
      );
      expect(statusRequests).toHaveLength(2);

      status.unsubscribe();
    });
  });

  describe("freezeCard", () => {
    it("posts the freeze with the session bearer token and the client key", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));

      const store = makeStore(async () => "session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.freezeCard.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/card/freeze");
      expect(request(fetchSpy).method).toBe("POST");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(result.data).toEqual({ success: true });
    });

    it("surfaces a card that is already frozen as a 400", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(errorResponse(400, "Card is already frozen"));

      const store = makeStore(async () => "session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.freezeCard.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({
        status: 400,
        data: { message: "Card is already frozen" },
      });
    });

    it("refetches the card status, because freezing moves it to FROZEN", async () => {
      let cardState = "ACTIVE";
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (input: RequestInfo | URL) => {
          if (new URL((input as Request).url).pathname === "/v1/card/freeze") {
            cardState = "FROZEN";
            return jsonResponse({ success: true });
          }
          return jsonResponse({ ...cardStatus, status: cardState });
        });

      const store = makeStore(async () => "session-token");
      const subscription = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await subscription;
      await store.dispatch(cardManagementApi.endpoints.freezeCard.initiate());
      await flushPendingRequests();

      const statusRequests = fetchSpy.mock.calls.filter(
        ([input]) => new URL((input as Request).url).pathname === "/v1/card/status",
      );
      expect(statusRequests).toHaveLength(2);
      expect(
        cardManagementApi.endpoints.getCardStatus.select()(store.getState()).data?.status,
      ).toBe("FROZEN");

      subscription.unsubscribe();
    });
  });

  describe("unfreezeCard", () => {
    it("posts the unfreeze with the session bearer token and the client key", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));

      const store = makeStore(async () => "session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.unfreezeCard.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/card/unfreeze");
      expect(request(fetchSpy).method).toBe("POST");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(result.data).toEqual({ success: true });
    });

    it("surfaces a card that is not frozen as a 400", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(errorResponse(400, "Card is not frozen"));

      const store = makeStore(async () => "session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.unfreezeCard.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({ status: 400, data: { message: "Card is not frozen" } });
    });

    it("refetches the card status, because unfreezing moves it back to ACTIVE", async () => {
      let cardState = "FROZEN";
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (input: RequestInfo | URL) => {
          if (new URL((input as Request).url).pathname === "/v1/card/unfreeze") {
            cardState = "ACTIVE";
            return jsonResponse({ success: true });
          }
          return jsonResponse({ ...cardStatus, status: cardState });
        });

      const store = makeStore(async () => "session-token");
      const subscription = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await subscription;
      await store.dispatch(cardManagementApi.endpoints.unfreezeCard.initiate());
      await flushPendingRequests();

      const statusRequests = fetchSpy.mock.calls.filter(
        ([input]) => new URL((input as Request).url).pathname === "/v1/card/status",
      );
      expect(statusRequests).toHaveLength(2);
      expect(
        cardManagementApi.endpoints.getCardStatus.select()(store.getState()).data?.status,
      ).toBe("ACTIVE");

      subscription.unsubscribe();
    });
  });

  describe("getInternalWallets", () => {
    it("reads every custodial wallet with the bearer token and the client key", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse(internalWalletsOnTheWire));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getInternalWallets.initiate(),
      );

      expect(request(fetchSpy).url).toBe("https://card.test/v1/wallet/internal");
      expect(request(fetchSpy).method).toBe("GET");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(result.data).toEqual(internalWallets);
    });

    it("keeps the balance a string, so the provider's precision survives", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          jsonResponse([{ ...internalWallets[0], balance: "9007199254740993.000001" }]),
        );

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getInternalWallets.initiate(),
      );

      expect(result.data?.[0].balance).toBe("9007199254740993.000001");
    });

    it("drops the keys the wire contract does not declare", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse([internalWalletsOnTheWire[0]]));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getInternalWallets.initiate(),
      );

      expect(result.data).toEqual([internalWallets[0]]);
    });

    it("accepts a user with no wallets as an empty list, not an error", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getInternalWallets.initiate(),
      );

      expect(result.data).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it("rejects a balance the provider sent as a number", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse([{ ...internalWallets[0], balance: 125.4 }]));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getInternalWallets.initiate(),
      );

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it("rejects an envelope where the contract promises a bare array", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse({ wallets: internalWallets }));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getInternalWallets.initiate(),
      );

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("getCardLinkedWallets", () => {
    it("reads the linked wallets with the bearer token and the client key", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(linkedWallets));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getCardLinkedWallets.initiate(),
      );

      expect(request(fetchSpy).url).toBe("https://card.test/v1/wallet/internal/card_linked");
      expect(request(fetchSpy).method).toBe("GET");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(result.data).toEqual(linkedWallets);
    });

    it("keeps a priority of zero, which is the first wallet charged", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse([{ ...linkedWallets[0], priority: 0 }]));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getCardLinkedWallets.initiate(),
      );

      expect(result.data?.[0].priority).toBe(0);
    });

    it("accepts a card with nothing linked to it as an empty list", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getCardLinkedWallets.initiate(),
      );

      expect(result.data).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it("rejects a wallet whose priority is not a number", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse([{ ...linkedWallets[0], priority: "1" }]));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getCardLinkedWallets.initiate(),
      );

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("getCardOnboardingStatus", () => {
    const onboardingStatus = {
      steps: [
        {
          id: "kyc",
          title: "Verify your identity",
          description: "Complete KYC verification to activate your card.",
          isDone: true,
        },
        {
          id: "address",
          title: "Add shipping address",
          description: "Tell us where to send your physical card.",
          isDone: false,
        },
      ],
    };

    it("reads the onboarding steps with the bearer token and the client key", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(onboardingStatus));

      const store = makeStore(async () => "session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getCardOnboardingStatus.initiate(),
      );

      expect(request(fetchSpy).url).toBe("https://card.test/v1/card/onboarding-status");
      expect(request(fetchSpy).method).toBe("GET");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(result.data).toEqual(onboardingStatus);
    });

    it("rejects a step whose done flag is not a boolean", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse({
          steps: [{ ...onboardingStatus.steps[0], isDone: "yes" }],
        }),
      );

      const store = makeStore(async () => "session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getCardOnboardingStatus.initiate(),
      );

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  it("rejects a response that does not match the wire contract", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ id: "not-a-uuid", verification_state: "VERIFIED" }));

    const store = makeStore("session-token");
    const result = await store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
