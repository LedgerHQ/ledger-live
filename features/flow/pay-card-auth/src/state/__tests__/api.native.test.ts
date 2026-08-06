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

const makeStore = () =>
  configureStore({
    reducer: { [payCardApi.reducerPath]: payCardApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: payCardApiExtra({ payCardApiBaseUrl: "https://card.test" }),
        },
      }).concat(payCardApi.middleware),
  });

describe("payCardAuthApi", () => {
  let fetchSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  afterEach(() => {
    fetchSpy?.mockRestore();
    warnSpy?.mockRestore();
    errorSpy?.mockRestore();
  });

  it("injects its endpoint into the shared Card API service", () => {
    expect(payCardAuthApi.reducerPath).toBe(payCardApi.reducerPath);
    expect(payCardAuthApi.endpoints.preAuth).toBeDefined();
  });

  it("posts the provider to pre-auth and returns the login URL", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ loginUrl: "https://card.test/login" }));

    const store = makeStore();
    const result = await store.dispatch(
      payCardAuthApi.endpoints.preAuth.initiate({ provider: "baanx" }),
    );

    expect(request(fetchSpy).url).toBe("https://card.test/card/v1/pre-auth");
    expect(request(fetchSpy).method).toBe("POST");
    expect(request(fetchSpy).headers.get("accept")).toBe("application/json");
    expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({ provider: "baanx" });
    expect(result.data).toEqual({ loginUrl: "https://card.test/login" });
  });

  it("rejects a response that does not match the wire contract without reporting an error", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ loginUrl: "not-a-url" }));
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const store = makeStore();
    const result = await store.dispatch(
      payCardAuthApi.endpoints.preAuth.initiate({ provider: "baanx" }),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "invalid pre-auth response",
    });
    expect(warnSpy).toHaveBeenCalled();
    // `console.error` is forwarded to Datadog/Sentry as an error event; a backend contract change
    // must not produce one.
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
