import { configureStore } from "@reduxjs/toolkit";
import { cardApi, cardApiExtra } from "@shared/api-services";
import { cardManagementApi, useGetCardStatusQuery, useOrderCardMutation } from "./api";
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

// The provider's own example response, field for field.
const cardStatus = {
  id: "000000000050277836",
  holderName: "JOHN DOE",
  expiryDate: "2028/01",
  panLast4: "1234",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2023-03-27T17:07:12.662Z",
};

// Wired the way the apps wire it: the store registers the service api, never this package.
const makeStore = (
  getCardSessionToken: () => Promise<string | null> = () => Promise.resolve(null),
) =>
  configureStore({
    reducer: {
      [cardApi.reducerPath]: cardApi.reducer,
    },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cardApiExtra({
            cardApiBaseUrl: "https://card.test",
            cardBaanxClientKey: "client-key",
            getCardSessionToken,
            refreshCardSession: () => Promise.resolve(null),
          }),
        },
      }).concat(cardApi.middleware),
  });

describe("cardManagementApi configuration", () => {
  it("is the Card service api, mutated in place by injectEndpoints", () => {
    expect(cardManagementApi).toBe(cardApi);
    expect(cardManagementApi.reducerPath).toBe("cardApi");
  });

  it("injects exactly its own endpoints", () => {
    expect(Object.keys(cardManagementApi.endpoints).sort()).toEqual([
      "exchangeAuthorizationCode",
      "getCardStatus",
      "getUser",
      "logout",
      "orderCard",
      "refreshSession",
    ]);
  });

  it("exposes the orderCard endpoint and its hook", () => {
    expect(cardManagementApi.endpoints.orderCard).toBeDefined();
    expect(useOrderCardMutation).toBeDefined();
  });

  it("exposes the getCardStatus endpoint and its hook", () => {
    expect(cardManagementApi.endpoints.getCardStatus).toBeDefined();
    expect(useGetCardStatusQuery).toBeDefined();
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
    it("posts the authorization_code grant and maps the session onto camelCase", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore();
      const result = await store.dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate({
          code: "auth-code",
          codeVerifier: "verifier",
        }),
      );

      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/oauth2/token");
      expect(request(fetchSpy).method).toBe("POST");
      expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
        grant_type: "authorization_code",
        code: "auth-code",
        code_verifier: "verifier",
      });
      expect(result.data).toEqual(session);
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
      const result = await store.dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate({
          code: "auth-code",
          codeVerifier: "verifier",
        }),
      );
      const serializedError = JSON.stringify(result.error);

      expect(result.data).toBeUndefined();
      expect(serializedError).not.toContain("sensitive-access-token");
      expect(serializedError).not.toContain("sensitive-refresh-token");
    });
  });

  describe("refreshSession", () => {
    it("reuses the token endpoint with the refresh_token grant", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore();
      const result = await store.dispatch(
        cardManagementApi.endpoints.refreshSession.initiate({ refreshToken: "rt_token" }),
      );

      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/oauth2/token");
      expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
        grant_type: "refresh_token",
        refresh_token: "rt_token",
      });
      expect(result.data).toEqual(session);
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

      const store = makeStore(async () => "session-token");
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

      const store = makeStore(async () => "session-token");
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

      const store = makeStore(async () => "session-token");
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

      const store = makeStore(async () => "session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.orderCard.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("getCardStatus", () => {
    it("reads the card and drops everything the wire contract does not declare", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(cardStatus));

      const store = makeStore(async () => "session-token");
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

      const store = makeStore(async () => "session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getCardStatus.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({ status: 404 });
    });

    it("rejects a status the wire contract does not name", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse({ ...cardStatus, status: "SOMETHING_ELSE" }));

      const store = makeStore(async () => "session-token");
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

      const store = makeStore(async () => "session-token");
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

  it("rejects a response that does not match the wire contract", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ id: "not-a-uuid", verification_state: "VERIFIED" }));

    const store = makeStore(async () => "session-token");
    const result = await store.dispatch(cardManagementApi.endpoints.getUser.initiate());

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
