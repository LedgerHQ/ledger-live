import { configureStore } from "@reduxjs/toolkit";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { calApi, calApiExtra, getCalExtra } from "./api";
import { CAL_REQUEST_TIMEOUT_MS, MAX_RETRIES } from "./constants";
import type { CalApiExtra } from "./types";

const valid = {
  calServiceUrl: "https://cal.test",
  ledgerClientVersion: "test",
};

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

// The base query is private, so drive it the way a use case does: through an injected endpoint.
function probeStore(extra: CalApiExtra) {
  const api = calApi.injectEndpoints({
    endpoints: build => ({
      probe: build.query<unknown, void>({ query: () => "/probe" }),
    }),
    overrideExisting: true,
  });
  const store = configureStore({
    reducer: { [calApi.reducerPath]: calApi.reducer },
    middleware: gdm => gdm({ thunk: { extraArgument: extra } }).concat(calApi.middleware),
  });
  return { api, store };
}

const probe = jest.fn();
const server = setupServer(http.get("https://cal.test/probe", probe));

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  probe.mockReset().mockImplementation(() => HttpResponse.json({ ok: true }));
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function received(call = 0): Request {
  return probe.mock.calls[call][0].request;
}

describe("calBaseQuery", () => {
  it("resolves requests against the configured service url", async () => {
    const { api, store } = probeStore(calApiExtra(valid));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    expect(received().url).toBe("https://cal.test/probe");
  });

  it("sends the json content type and the client version header", async () => {
    const { api, store } = probeStore(calApiExtra(valid));
    await store.dispatch(api.endpoints.probe.initiate());

    const { headers } = received();
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-Ledger-Client-Version")).toBe("test");
  });
});

describe("calBaseQuery timeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ends a hung request with a TIMEOUT_ERROR, without a retry", async () => {
    probe.mockImplementation(() => new Promise(() => {}));

    const { api, store } = probeStore(calApiExtra(valid));
    const pending = store.dispatch(api.endpoints.probe.initiate());
    await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result.error).toMatchObject({ status: "TIMEOUT_ERROR" });
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("clears its timer when the request settles", async () => {
    probe.mockImplementation(() => HttpResponse.json({ ok: true }));

    const { api, store } = probeStore(calApiExtra(valid));
    await store.dispatch(api.endpoints.probe.initiate());
    await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);

    expect(received().signal.aborted).toBe(false);
  });

  it("aborts the request when the query is cancelled", async () => {
    probe.mockImplementation(() => new Promise(() => {}));

    const { api, store } = probeStore(calApiExtra(valid));
    const pending = store.dispatch(api.endpoints.probe.initiate());
    await jest.advanceTimersByTimeAsync(0);
    pending.abort();
    await pending;

    expect(received().signal.aborted).toBe(true);
  });

  it("sends no further request when the query is cancelled during a retry", async () => {
    probe.mockImplementation(() => HttpResponse.json({}, { status: 503 }));

    const { api, store } = probeStore(calApiExtra(valid));
    const pending = store.dispatch(api.endpoints.probe.initiate());
    await jest.advanceTimersByTimeAsync(0);
    pending.abort();
    await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
    await pending;

    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("still retries a server error", async () => {
    probe.mockImplementation(() => HttpResponse.json({}, { status: 503 }));

    const { api, store } = probeStore(calApiExtra(valid));
    const pending = store.dispatch(api.endpoints.probe.initiate());
    await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result.error).toMatchObject({ status: 503 });
    expect(probe).toHaveBeenCalledTimes(MAX_RETRIES + 1);
  });
});
