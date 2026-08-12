import { configureStore } from "@reduxjs/toolkit";
import { payCardApi, payCardApiExtra } from "@shared/api-services";
import { payCardAuthApi } from "../api";

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

const makeStore = () =>
  configureStore({
    reducer: { [payCardApi.reducerPath]: payCardApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: payCardApiExtra({
            payCardApiBaseUrl: "https://card.test",
            payCardBaanxClientKey: "client-key",
          }),
        },
      }).concat(payCardApi.middleware),
  });

describe("payCardAuthApi", () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("injects its endpoints into the shared Card API service", () => {
    expect(payCardAuthApi.reducerPath).toBe(payCardApi.reducerPath);
    expect(payCardAuthApi.endpoints.initiateAuthorize).toBeDefined();
    expect(payCardAuthApi.endpoints.exchangeAuthorizationCode).toBeDefined();
    expect(payCardAuthApi.endpoints.refreshSession).toBeDefined();
    expect(payCardAuthApi.endpoints.logout).toBeDefined();
    expect(payCardAuthApi.endpoints.getUser).toBeDefined();
  });

  describe("initiateAuthorize", () => {
    it("sends the OAuth parameters and returns the hosted login URL", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse({ token: "jwt", url: "https://card.test/login" }));

      const store = makeStore();
      const result = await store.dispatch(
        payCardAuthApi.endpoints.initiateAuthorize.initiate({
          clientId: "client-id",
          redirectUri: "ledgerlive://card",
          state: "state-value",
          codeChallenge: "challenge-value",
        }),
      );

      const { searchParams, pathname } = new URL(request(fetchSpy).url);
      expect(pathname).toBe("/v1/auth/oauth/authorize/initiate");
      expect(request(fetchSpy).method).toBe("GET");
      expect(Object.fromEntries(searchParams)).toEqual({
        client_id: "client-id",
        response_type: "code",
        redirect_uri: "ledgerlive://card",
        state: "state-value",
        code_challenge: "challenge-value",
        code_challenge_method: "S256",
      });
      // Set by the shared base query for every endpoint, not by this use case.
      expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
      expect(result.data).toEqual({ token: "jwt", url: "https://card.test/login" });
    });
  });

  describe("exchangeAuthorizationCode", () => {
    it("posts the authorization_code grant and maps the session onto camelCase", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore();
      const result = await store.dispatch(
        payCardAuthApi.endpoints.exchangeAuthorizationCode.initiate({
          code: "auth-code",
          redirectUri: "ledgerlive://card",
          codeVerifier: "verifier",
        }),
      );

      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/oauth/token");
      expect(request(fetchSpy).method).toBe("POST");
      expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
        grant_type: "authorization_code",
        code: "auth-code",
        redirect_uri: "ledgerlive://card",
        code_verifier: "verifier",
      });
      expect(result.data).toEqual(session);
    });
  });

  describe("refreshSession", () => {
    it("reuses the token endpoint with the refresh_token grant", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));

      const store = makeStore();
      const result = await store.dispatch(
        payCardAuthApi.endpoints.refreshSession.initiate({ refreshToken: "rt_token" }),
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
    it("sends the bearer token alongside the client key", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));

      const store = makeStore();
      const result = await store.dispatch(payCardAuthApi.endpoints.logout.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/auth/logout");
      expect(request(fetchSpy).method).toBe("POST");
      // The token is still the placeholder: `Headers` trims, so the empty value leaves "Bearer".
      expect(request(fetchSpy).headers.get("authorization")).toBe("Bearer");
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

      const store = makeStore();
      const result = await store.dispatch(payCardAuthApi.endpoints.getUser.initiate());

      expect(request(fetchSpy).url).toBe("https://card.test/v1/user");
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
      payCardAuthApi.endpoints.initiateAuthorize.initiate({
        clientId: "client-id",
        redirectUri: "ledgerlive://card",
        state: "state-value",
        codeChallenge: "challenge-value",
      }),
    );

    // Only that the schema is wired and rejects. How the failure is reported and converted is
    // `onSchemaFailure`/`catchSchemaFailure`, which belong to `createApi` on the Card API service.
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
