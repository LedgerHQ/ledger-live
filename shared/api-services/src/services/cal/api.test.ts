import { configureStore } from "@reduxjs/toolkit";
import { calApi, calApiExtra, getCalExtra } from "./api";
import { CAL_REQUEST_TIMEOUT_MS, MAX_RETRIES } from "./constants";
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

  describe("timeout", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("ends a hung request with a TIMEOUT_ERROR, without a retry", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(hangUntilAborted);

      const { api, store } = probeStore(calApiExtra(valid));
      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
      const result = await pending;

      expect(result.error).toMatchObject({ status: "TIMEOUT_ERROR" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("clears its timer when the request settles", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

      const { api, store } = probeStore(calApiExtra(valid));
      await store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);

      expect(request(fetchSpy).signal.aborted).toBe(false);
    });

    it("aborts the request when the query is cancelled", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(hangUntilAborted);

      const { api, store } = probeStore(calApiExtra(valid));
      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(0);
      pending.abort();
      await pending;

      expect(request(fetchSpy).signal.aborted).toBe(true);
    });

    it("sends no further request when the query is cancelled during a retry", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => Promise.resolve(jsonResponse({}, 503)));

      const { api, store } = probeStore(calApiExtra(valid));
      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(0);
      pending.abort();
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
      await pending;

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("still retries a server error", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => Promise.resolve(jsonResponse({}, 503)));

      const { api, store } = probeStore(calApiExtra(valid));
      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
      const result = await pending;

      expect(result.error).toMatchObject({ status: 503 });
      expect(fetchSpy).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** A fetch that never answers and rejects only when its request is aborted. */
function hangUntilAborted(input: RequestInfo | URL): Promise<Response> {
  const { signal } = input as Request;
  return new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
}

function request(spy: jest.SpyInstance): Request {
  return spy.mock.calls[0][0] as Request;
}
