import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import { calApi, calApiExtra, getCalExtra } from "./api";
import { CAL_REQUEST_TIMEOUT_MS, MAX_RETRIES } from "./constants";
import type { CalApiExtra } from "./types";

const valid = { calServiceUrl: "https://cal.test", ledgerClientVersion: "test" };

/** An answer that never comes. */
const hang = () => new Promise<Response>(() => undefined);

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
  const server = setupServer();
  const probeUrl = "https://cal.test/probe";
  let requests: Request[] = [];

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  afterEach(() => {
    server.resetHandlers();
    requests = [];
    jest.useRealTimers();
  });

  // Every answer is recorded, so a test can count attempts and read what was sent.
  function answer(response: () => Response | Promise<Response>) {
    server.use(
      http.get(probeUrl, ({ request }) => {
        requests.push(request);
        return response();
      }),
    );
  }

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

  it("resolves requests against the configured service url", async () => {
    answer(() => HttpResponse.json({ ok: true }));

    const { api, store } = probeStore(calApiExtra(valid));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    expect(requests[0]?.url).toBe(probeUrl);
  });

  it("sends the json content type and the client version header", async () => {
    answer(() => HttpResponse.json({}));

    const { api, store } = probeStore(calApiExtra(valid));
    await store.dispatch(api.endpoints.probe.initiate());

    expect(requests[0]?.headers.get("Content-Type")).toBe("application/json");
    expect(requests[0]?.headers.get("X-Ledger-Client-Version")).toBe("test");
  });

  describe("request policy", () => {
    // Longer than the store's own short timers (10ms and 500ms), shorter than any request timeout.
    const STORE_TIMERS_MS = 1_000;

    beforeEach(() =>
      jest.useFakeTimers({ doNotFake: ["queueMicrotask", "nextTick", "setImmediate"] }),
    );

    // Runs every timeout and retry backoff, so a request that never settles fails the test.
    async function probe() {
      const { api, store } = probeStore(calApiExtra(valid));
      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.runAllTimersAsync();
      return pending;
    }

    it("ends a hung request with TIMEOUT_ERROR, and does not retry it", async () => {
      answer(hang);

      const result = await probe();

      expect(result.error).toMatchObject({ status: "TIMEOUT_ERROR" });
      expect(requests).toHaveLength(1);
    });

    it("does not end a slow request before the timeout", async () => {
      answer(hang);
      const { api, store } = probeStore(calApiExtra(valid));

      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS - 1);
      expect(api.endpoints.probe.select()(store.getState()).isLoading).toBe(true);

      await jest.advanceTimersByTimeAsync(1);
      expect((await pending).error).toMatchObject({ status: "TIMEOUT_ERROR" });
    });

    it("lets a request set its own timeout", async () => {
      answer(hang);
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
      answer(() => HttpResponse.json({ ok: true }));
      const { api, store } = probeStore(calApiExtra(valid));

      const result = await store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(STORE_TIMERS_MS);

      expect(result.data).toEqual({ ok: true });
      expect(jest.getTimerCount()).toBe(0);
    });

    it("forwards a caller abort to the request, and leaves no timer behind", async () => {
      answer(hang);
      const { api, store } = probeStore(calApiExtra(valid));

      const pending = store.dispatch(api.endpoints.probe.initiate());
      await jest.advanceTimersByTimeAsync(0);
      pending.abort();
      await jest.advanceTimersByTimeAsync(STORE_TIMERS_MS);

      expect(requests[0]?.signal.aborted).toBe(true);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("retries a network error", async () => {
      answer(() => HttpResponse.error());

      const result = await probe();

      expect(result.error).toMatchObject({ status: "FETCH_ERROR" });
      expect(requests).toHaveLength(MAX_RETRIES + 1);
    });

    it("retries a 5xx", async () => {
      answer(() => HttpResponse.json({}, { status: 503 }));

      const result = await probe();

      expect(result.error).toMatchObject({ status: 503 });
      expect(requests).toHaveLength(MAX_RETRIES + 1);
    });

    it("returns the data of a retry that passes", async () => {
      let attempt = 0;
      answer(() =>
        (attempt += 1) === 1
          ? HttpResponse.json({}, { status: 503 })
          : HttpResponse.json({ ok: true }),
      );

      const result = await probe();

      expect(result.data).toEqual({ ok: true });
      expect(requests).toHaveLength(2);
    });

    it("does not retry a 4xx", async () => {
      answer(() => HttpResponse.json({}, { status: 404 }));

      const result = await probe();

      expect(result.error).toMatchObject({ status: 404 });
      expect(requests).toHaveLength(1);
    });

    it("retries a 5xx with a body that is not json", async () => {
      answer(
        () =>
          new HttpResponse("<html>Bad Gateway</html>", {
            status: 502,
            headers: { "content-type": "application/json" },
          }),
      );

      const result = await probe();

      expect(result.error).toMatchObject({ status: "PARSING_ERROR", originalStatus: 502 });
      expect(requests).toHaveLength(MAX_RETRIES + 1);
    });

    it("does not retry a body that is not json", async () => {
      answer(
        () => new HttpResponse("not json", { headers: { "content-type": "application/json" } }),
      );

      const result = await probe();

      expect(result.error).toMatchObject({ status: "PARSING_ERROR" });
      expect(requests).toHaveLength(1);
    });
  });
});
