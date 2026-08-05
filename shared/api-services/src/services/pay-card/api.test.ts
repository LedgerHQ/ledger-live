import { configureStore } from "@reduxjs/toolkit";
import { payCardApi, payCardApiExtra } from "./api";

const valid = { payCardApiBaseUrl: "https://card.test" };

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(payCardApi.endpoints);

describe("payCardApi", () => {
  it("has the correct reducer path", () => {
    expect(payCardApi.reducerPath).toBe("payCardApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("payCardApiExtra", () => {
  it("returns the validated config", () => {
    expect(payCardApiExtra(valid)).toEqual(valid);
  });

  it("trims the base url", () => {
    expect(payCardApiExtra({ payCardApiBaseUrl: " https://card.test " })).toEqual(valid);
  });

  it("throws when the base url is missing or blank", () => {
    // @ts-expect-error — payCardApiBaseUrl is required
    expect(() => payCardApiExtra({})).toThrow();
    expect(() => payCardApiExtra({ payCardApiBaseUrl: "  " })).toThrow();
  });
});

describe("payCardBaseQuery", () => {
  let fetchSpy: jest.SpyInstance;

  // The base query is private, so drive it the way a use case does: through an injected endpoint.
  function probeStore(extra?: unknown) {
    const api = payCardApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "/probe" }) }),
      overrideExisting: true,
    });
    const store = configureStore({
      reducer: { [payCardApi.reducerPath]: payCardApi.reducer },
      middleware: gdm => gdm({ thunk: { extraArgument: extra } }).concat(payCardApi.middleware),
    });
    return { api, store };
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("resolves requests against the configured base url", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { api, store } = probeStore(payCardApiExtra(valid));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toBe("https://card.test/probe");
    expect(request.headers.get("accept")).toBe("application/json");
    expect(request.headers.get("authorization")).toBeNull();
  });

  it("sends the app session token as a bearer once the flow has one", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { api, store } = probeStore(
      payCardApiExtra({ ...valid, getPayCardSessionToken: () => "cs_example-session-token" }),
    );
    await store.dispatch(api.endpoints.probe.initiate());

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.headers.get("authorization")).toBe("Bearer cs_example-session-token");
  });

  it("fails without fetching when the extraArgument is not configured", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch");

    const { api, store } = probeStore();
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "payCardApiExtra not configured in store extraArgument",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
