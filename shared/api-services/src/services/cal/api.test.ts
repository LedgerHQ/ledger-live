import { configureStore } from "@reduxjs/toolkit";
import { calApi, calApiExtra, getCalExtra } from "./api";
import type { CalApiExtra } from "./types";

const valid = { calServiceUrl: "https://cal.test", ledgerClientVersion: "test" };

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(calApi.endpoints);

describe("calApi", () => {
  it("has the correct reducer path", () => {
    expect(calApi.reducerPath).toBe("calApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("calApiExtra", () => {
  it("returns the validated config", () => {
    expect(calApiExtra(valid)).toEqual(valid);
  });

  it("keeps the optional logger", () => {
    const logger = jest.fn();
    expect(calApiExtra({ ...valid, logger })).toEqual({ ...valid, logger });
  });

  it("throws when the service url is missing or empty", () => {
    // @ts-expect-error — calServiceUrl is required
    expect(() => calApiExtra({ ledgerClientVersion: "test" })).toThrow();
    expect(() => calApiExtra({ ...valid, calServiceUrl: "" })).toThrow();
  });

  it("throws when the client version is missing or empty", () => {
    // @ts-expect-error — ledgerClientVersion is required
    expect(() => calApiExtra({ calServiceUrl: "https://cal.test" })).toThrow();
    expect(() => calApiExtra({ ...valid, ledgerClientVersion: "" })).toThrow();
  });
});

describe("getCalExtra", () => {
  it("reads the config off the thunk extraArgument", () => {
    expect(getCalExtra({ extra: valid })).toBe(valid);
  });
});

describe("calBaseQuery", () => {
  let fetchSpy: jest.SpyInstance;

  // The base query is private, so drive it the way a use case does: through an injected endpoint.
  function probeStore(extra: CalApiExtra) {
    const api = calApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "/probe" }) }),
      overrideExisting: true,
    });
    const store = configureStore({
      reducer: { [calApi.reducerPath]: calApi.reducer },
      middleware: gdm => gdm({ thunk: { extraArgument: extra } }).concat(calApi.middleware),
    });
    return { api, store };
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("resolves requests against the configured service url", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

    const { api, store } = probeStore(calApiExtra(valid));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    expect(request(fetchSpy).url).toBe("https://cal.test/probe");
  });

  it("sends the json content type and the client version header", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { api, store } = probeStore(calApiExtra(valid));
    await store.dispatch(api.endpoints.probe.initiate());

    const { headers } = request(fetchSpy);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-Ledger-Client-Version")).toBe("test");
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
