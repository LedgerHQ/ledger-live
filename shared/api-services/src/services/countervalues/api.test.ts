import { configureStore } from "@reduxjs/toolkit";
import { countervaluesApi, cvsApiExtra, getCvsExtra } from "./api";
import type { CvsApiExtra } from "./types";

const valid = { getCountervaluesServiceUrl: () => "https://cvs.test" };

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

  it("throws when the url getter is missing, or resolves to an empty url", () => {
    // @ts-expect-error: getCountervaluesServiceUrl is required
    expect(() => cvsApiExtra({})).toThrow();
    // @ts-expect-error: a url string is no longer accepted, only a getter
    expect(() => cvsApiExtra({ getCountervaluesServiceUrl: "https://cvs.test" })).toThrow();
    expect(() => cvsApiExtra({ getCountervaluesServiceUrl: () => "" })).toThrow();
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

  it("reads the service url again on every request", async () => {
    // The developer settings switch the env to staging while the app runs. The store holds the
    // getter, so the next request must go to the new url without a restart.
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.resolve(jsonResponse({})));
    let url = "https://cvs.production";

    const { api, store } = probeStore(cvsApiExtra({ getCountervaluesServiceUrl: () => url }));
    await store.dispatch(api.endpoints.probe.initiate());
    url = "https://cvs.staging";
    await store.dispatch(api.endpoints.probe.initiate(undefined, { forceRefetch: true }));

    expect(request(fetchSpy, 0).url).toBe("https://cvs.production/probe");
    expect(request(fetchSpy, 1).url).toBe("https://cvs.staging/probe");
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function request(spy: jest.SpyInstance, call = 0): Request {
  return spy.mock.calls[call][0] as Request;
}
