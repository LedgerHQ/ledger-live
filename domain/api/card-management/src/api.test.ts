import { configureStore } from "@reduxjs/toolkit";
import { cardApi, cardApiExtra } from "@shared/api-services";
import { cardManagementApi } from "./api";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function request(spy: jest.SpyInstance): Request {
  return spy.mock.calls[0][0] as Request;
}

const sessionResponse = {
  access_token: "at_token",
  expires_in: 21600,
  refresh_token: "rt_token",
  refresh_token_expires_in: 15897600,
};

const session = {
  accessToken: "at_token",
  expiresIn: 21600,
  refreshToken: "rt_token",
  refreshTokenExpiresIn: 15897600,
};

// Wired the way the apps wire it: the store registers the service api, never this package.
const makeStore = (getCardSessionToken: () => string | null = () => null) =>
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
      "getUser",
      "initiateAuthorize",
      "logout",
      "refreshSession",
    ]);
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

  describe("initiateAuthorize", () => {
    it("sends the OAuth parameters and returns the hosted login URL", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse({ token: "jwt", url: "https://card.test/login" }));

      const store = makeStore();
      const result = await store.dispatch(
        cardManagementApi.endpoints.initiateAuthorize.initiate({
          clientId: "client-key",
          redirectUri: "ledgerlive://paytab",
          state: "state-value",
          codeChallenge: "challenge-value",
        }),
      );

      const { searchParams, pathname } = new URL(request(fetchSpy).url);
      expect(pathname).toBe("/v1/auth/oauth/authorize/initiate");
      expect(request(fetchSpy).method).toBe("GET");
      expect(Object.fromEntries(searchParams)).toEqual({
        client_id: "client-key",
        response_type: "code",
        redirect_uri: "ledgerlive://paytab",
        state: "state-value",
        code_challenge: "challenge-value",
        code_challenge_method: "S256",
        mode: "api",
      });
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(request(fetchSpy).headers.get("authorization")).toBeNull();
      expect(result.data).toEqual({ url: "https://card.test/login" });
    });
  });

  describe("exchangeAuthorizationCode", () => {
    it("posts the authorization_code grant and maps the session onto camelCase", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore();
      const result = await store.dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate({
          code: "auth-code",
          redirectUri: "ledgerlive://paytab",
          codeVerifier: "verifier",
        }),
      );

      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/oauth/token");
      expect(request(fetchSpy).method).toBe("POST");
      expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
        grant_type: "authorization_code",
        code: "auth-code",
        redirect_uri: "ledgerlive://paytab",
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
          redirectUri: "ledgerlive://paytab",
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

      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/oauth/token");
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

      const store = makeStore(() => "session-token");
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

      const store = makeStore(() => "session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getUser.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/user");
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer session-token");
      expect(result.data).toEqual({
        id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        verificationState: "VERIFIED",
      });
    });
  });

  it("rejects a response that does not match the wire contract", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ token: "jwt", url: "not-a-url" }));

    const store = makeStore();
    const result = await store.dispatch(
      cardManagementApi.endpoints.initiateAuthorize.initiate({
        clientId: "client-key",
        redirectUri: "ledgerlive://paytab",
        state: "state-value",
        codeChallenge: "challenge-value",
      }),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
