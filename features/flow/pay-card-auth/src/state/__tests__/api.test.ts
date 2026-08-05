import { configureStore } from "@reduxjs/toolkit";
import { payCardApi, payCardApiExtra } from "@shared/api-services";
import { payCardAuthApi } from "../api";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

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

describe("payCardAuthApi", () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("injects its endpoints into the shared Card API service", () => {
    expect(payCardAuthApi.reducerPath).toBe(payCardApi.reducerPath);
    expect(payCardAuthApi.endpoints.preAuth).toBeDefined();
    expect(payCardAuthApi.endpoints.authenticate).toBeDefined();
    expect(payCardAuthApi.endpoints.getMe).toBeDefined();
  });

  it("posts the provider to pre-auth and returns the login URL", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ loginUrl: "https://card.test/login" }));

    const store = makeStore();
    const result = await store.dispatch(
      payCardAuthApi.endpoints.preAuth.initiate({ provider: "baanx" }),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toBe("https://card.test/card/v1/pre-auth");
    expect(request.method).toBe("POST");
    expect(request.headers.get("accept")).toBe("application/json");
    expect(JSON.parse(await request.clone().text())).toEqual({ provider: "baanx" });
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
      payCardAuthApi.endpoints.authenticate.initiate({
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

  it("gets the Pay Card user with the session token when the flow has one", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        verificationState: "VERIFIED",
        cardStatus: "ACTIVE",
        cardFunded: true,
        addedToDigitalWallet: false,
        hasFirstTransaction: false,
      }),
    );

    const store = makeStore({ getPayCardSessionToken: () => "cs_example-session-token" });
    const result = await store.dispatch(payCardAuthApi.endpoints.getMe.initiate());

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

  it("rejects a response that does not match the wire contract", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ loginUrl: "not-a-url" }));

    const store = makeStore();
    const result = await store.dispatch(
      payCardAuthApi.endpoints.preAuth.initiate({ provider: "baanx" }),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
