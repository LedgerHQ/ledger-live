import { configureStore } from "@reduxjs/toolkit";
import { payCardApi, payCardApiExtra } from "./api";

const valid = { payCardApiBaseUrl: "https://card.test", payCardBaanxClientKey: "client-key" };

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

  it("trims the base url and the client key", () => {
    expect(
      payCardApiExtra({
        payCardApiBaseUrl: " https://card.test ",
        payCardBaanxClientKey: " client-key ",
      }),
    ).toEqual(valid);
  });

  it("throws when the base url is missing or blank", () => {
    // @ts-expect-error — payCardApiBaseUrl is required
    expect(() => payCardApiExtra({ payCardBaanxClientKey: "client-key" })).toThrow();
    expect(() =>
      payCardApiExtra({ payCardApiBaseUrl: "  ", payCardBaanxClientKey: "client-key" }),
    ).toThrow();
  });

  // An unset key must not keep the apps from starting: only the Card requests that need it fail.
  it("accepts an empty client key", () => {
    expect(payCardApiExtra({ ...valid, payCardBaanxClientKey: "" })).toEqual({
      ...valid,
      payCardBaanxClientKey: "",
    });
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
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

    const { api, store } = probeStore(payCardApiExtra(valid));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    expect(request(fetchSpy).url).toBe("https://card.test/probe");
  });

  it("asks for json, sends the client key and no credentials", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { api, store } = probeStore(payCardApiExtra(valid));
    await store.dispatch(api.endpoints.probe.initiate());

    expect(request(fetchSpy).headers.get("accept")).toBe("application/json");
    expect(request(fetchSpy).headers.get("x-client-key")).toBe("client-key");
    expect(request(fetchSpy).headers.get("authorization")).toBeNull();
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

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function request(spy: jest.SpyInstance): Request {
  return spy.mock.calls[0][0] as Request;
}
