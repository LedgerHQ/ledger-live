import { configureStore } from "@reduxjs/toolkit";
import {
  payCardApi,
  payCardApiExtra,
  useAuthenticateMutation,
  useGetMeQuery,
  usePreAuthMutation,
} from "./api";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("payCardApi configuration", () => {
  it("has the correct reducer path", () => {
    expect(payCardApi.reducerPath).toBe("payCardApi");
  });

  it("exposes only the staging endpoints and hooks", () => {
    expect(payCardApi.endpoints.preAuth).toBeDefined();
    expect(payCardApi.endpoints.authenticate).toBeDefined();
    expect(payCardApi.endpoints.getMe).toBeDefined();
    expect((payCardApi.endpoints as Record<string, unknown>).logout).toBeUndefined();
    expect(usePreAuthMutation).toBeDefined();
    expect(useAuthenticateMutation).toBeDefined();
    expect(useGetMeQuery).toBeDefined();
  });
});

describe("payCardApiExtra", () => {
  it("returns the validated config with a default session token getter", () => {
    const config = payCardApiExtra({
      payCardApiBaseUrl: " https://card.test ",
    });

    expect(config.payCardApiBaseUrl).toBe("https://card.test");
    expect(config.getPayCardSessionToken()).toBeUndefined();
  });

  it("throws when the base URL is missing or empty", () => {
    // @ts-expect-error — payCardApiBaseUrl is required
    expect(() => payCardApiExtra({})).toThrow("payCardApiBaseUrl");
    expect(() => payCardApiExtra({ payCardApiBaseUrl: " " })).toThrow("payCardApiBaseUrl");
  });
});

describe("payCardApi HTTP requests", () => {
  let fetchSpy: jest.SpyInstance;

  const makeStore = (overrides: Partial<Parameters<typeof payCardApiExtra>[0]> = {}) =>
    configureStore({
      reducer: { [payCardApi.reducerPath]: payCardApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: payCardApiExtra({
              payCardApiBaseUrl: "https://card.test",
              ...overrides,
            }),
          },
        }).concat(payCardApi.middleware),
    });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("posts the provider to pre-auth and returns the login URL", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        loginUrl: "https://card.test/login",
      }),
    );

    const store = makeStore();
    const result = await store.dispatch(
      payCardApi.endpoints.preAuth.initiate({ provider: "baanx" }),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toBe("https://card.test/card/v1/pre-auth");
    expect(request.method).toBe("POST");
    expect(request.headers.get("accept")).toBe("application/json");
    expect(JSON.parse(await request.clone().text())).toEqual({
      provider: "baanx",
    });
    expect(result.data).toEqual({ loginUrl: "https://card.test/login" });
  });

  it("posts the OAuth state and code to auth and returns the session", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        appSessionToken: "cs_example-session-token",
        expiresAt: "2026-07-30T10:00:00Z",
      }),
    );

    const store = makeStore();
    const result = await store.dispatch(
      payCardApi.endpoints.authenticate.initiate({
        state: "oauth-state",
        code: "authorization-code",
      }),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toBe("https://card.test/card/v1/auth");
    expect(request.method).toBe("POST");
    expect(JSON.parse(await request.clone().text())).toEqual({
      state: "oauth-state",
      code: "authorization-code",
    });
    expect(result.data).toEqual({
      appSessionToken: "cs_example-session-token",
      expiresAt: "2026-07-30T10:00:00Z",
    });
  });

  it("gets the Pay Card user with the session token when available", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        verificationState: "VERIFIED",
        cardStatus: "ACTIVE",
        cardFunded: true,
        addedToDigitalWallet: false,
        hasFirstTransaction: false,
      }),
    );

    const store = makeStore({
      getPayCardSessionToken: () => "cs_example-session-token",
    });
    const result = await store.dispatch(payCardApi.endpoints.getMe.initiate());

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toBe("https://card.test/card/v1/me");
    expect(request.method).toBe("GET");
    expect(request.headers.get("authorization")).toBe("Bearer cs_example-session-token");
    expect(result.data).toEqual({
      verificationState: "VERIFIED",
      cardStatus: "ACTIVE",
      cardFunded: true,
      addedToDigitalWallet: false,
      hasFirstTransaction: false,
    });
  });
});
