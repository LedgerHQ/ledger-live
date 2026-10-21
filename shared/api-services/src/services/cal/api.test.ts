import { configureStore } from "@reduxjs/toolkit";
import type { FetchArgs } from "@reduxjs/toolkit/query";
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
  function probeStore(extra: CalApiExtra, query: () => string | FetchArgs = () => "/probe") {
    const api = calApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query }) }),
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
    jest.useRealTimers();
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

  describe("request policy", () => {
    // Longer than the store's own short timers (10ms and 500ms), shorter than any request timeout.
    const STORE_TIMERS_MS = 1_000;

    beforeEach(() => jest.useFakeTimers());

    // Runs every timeout and retry backoff, so a request that never settles fails the test.
    async function probe() {
      const { api, store } = probeStore(calApiExtra(valid));
      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.runAllTimersAsync();
      return pending;
    }

    it("ends a hung request with TIMEOUT_ERROR, and does not retry it", async () => {
      fetchSpy = hangingFetch();

      const result = await probe();

      expect(result.error).toMatchObject({ status: "TIMEOUT_ERROR" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("does not end a slow request before the timeout", async () => {
      fetchSpy = hangingFetch();
      const { api, store } = probeStore(calApiExtra(valid));

      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS - 1);
      expect(api.endpoints.probe.select()(store.getState()).isLoading).toBe(true);

      await jest.advanceTimersByTimeAsync(1);
      expect((await pending).error).toMatchObject({ status: "TIMEOUT_ERROR" });
    });

    it("lets a request set its own timeout", async () => {
      fetchSpy = hangingFetch();
      const { api, store } = probeStore(calApiExtra(valid), () => ({
        url: "/probe",
        timeout: 30_000,
      }));

      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
      expect(api.endpoints.probe.select()(store.getState()).isLoading).toBe(true);

      await jest.advanceTimersByTimeAsync(30_000 - CAL_REQUEST_TIMEOUT_MS);
      expect((await pending).error).toMatchObject({ status: "TIMEOUT_ERROR" });
    });

    it("leaves no timer behind after a request that passes", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));
      const { api, store } = probeStore(calApiExtra(valid));

      const result = await store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(STORE_TIMERS_MS);

      expect(result.data).toEqual({ ok: true });
      expect(jest.getTimerCount()).toBe(0);
    });

    it("forwards a caller abort to the request, and leaves no timer behind", async () => {
      fetchSpy = hangingFetch();
      const { api, store } = probeStore(calApiExtra(valid));

      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(0);
      pending.abort();
      await jest.advanceTimersByTimeAsync(STORE_TIMERS_MS);

      expect(request(fetchSpy).signal.aborted).toBe(true);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("retries a network error", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new TypeError("Failed to fetch"));

      const result = await probe();

      expect(result.error).toMatchObject({ status: "FETCH_ERROR" });
      expect(fetchSpy).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });

    it("retries a 5xx", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => Promise.resolve(jsonResponse({}, 503)));

      const result = await probe();

      expect(result.error).toMatchObject({ status: 503 });
      expect(fetchSpy).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });

    it("returns the data of a retry that passes", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(jsonResponse({}, 503))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await probe();

      expect(result.data).toEqual({ ok: true });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("does not retry a 4xx", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => Promise.resolve(jsonResponse({}, 404)));

      const result = await probe();

      expect(result.error).toMatchObject({ status: 404 });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("retries a 5xx with a body that is not json", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response("<html>Bad Gateway</html>", {
            status: 502,
            headers: { "content-type": "application/json" },
          }),
        ),
      );

      const result = await probe();

      expect(result.error).toMatchObject({ status: "PARSING_ERROR", originalStatus: 502 });
      expect(fetchSpy).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });

    it("does not retry a body that is not json", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() =>
          Promise.resolve(
            new Response("not json", { headers: { "content-type": "application/json" } }),
          ),
        );

      const result = await probe();

      expect(result.error).toMatchObject({ status: "PARSING_ERROR" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** A fetch that never answers, and only settles when its request is aborted. */
function hangingFetch(): jest.SpyInstance {
  return jest.spyOn(globalThis, "fetch").mockImplementation(
    input =>
      new Promise((_resolve, reject) => {
        const { signal } = input as Request;
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }),
  );
}

function request(spy: jest.SpyInstance): Request {
  return spy.mock.calls[0][0] as Request;
}
