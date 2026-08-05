import { configureStore } from "@reduxjs/toolkit";
import { countervaluesApi, cvsApiExtra, getCvsExtra } from "./api";
import type { CvsApiExtra } from "./types";

const valid = { countervaluesServiceUrl: "https://cvs.test" };

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(countervaluesApi.endpoints);

describe("countervaluesApi", () => {
  it("has the correct reducer path", () => {
    expect(countervaluesApi.reducerPath).toBe("countervaluesApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("cvsApiExtra", () => {
  it("returns the validated config", () => {
    expect(cvsApiExtra(valid)).toEqual(valid);
  });

  it("throws when the url is missing or empty", () => {
    // @ts-expect-error — countervaluesServiceUrl is required
    expect(() => cvsApiExtra({})).toThrow();
    expect(() => cvsApiExtra({ countervaluesServiceUrl: "" })).toThrow();
  });
});

describe("getCvsExtra", () => {
  it("reads the config off the thunk extraArgument", () => {
    expect(getCvsExtra({ extra: valid })).toBe(valid);
  });
});

describe("cvsBaseQuery", () => {
  let fetchSpy: jest.SpyInstance;

  // The base query is private, so drive it the way a use case does: through an injected endpoint.
  function probeStore(extra: CvsApiExtra) {
    const api = countervaluesApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "/probe" }) }),
      overrideExisting: true,
    });
    const store = configureStore({
      reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
      middleware: gdm =>
        gdm({ thunk: { extraArgument: extra } }).concat(countervaluesApi.middleware),
    });
    return { api, store };
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("resolves requests against the configured service url", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

    const { api, store } = probeStore(cvsApiExtra(valid));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    expect(request(fetchSpy).url).toBe("https://cvs.test/probe");
  });

  it("asks for json", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { api, store } = probeStore(cvsApiExtra(valid));
    await store.dispatch(api.endpoints.probe.initiate());

    expect(request(fetchSpy).headers.get("Accept")).toBe("application/json");
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
