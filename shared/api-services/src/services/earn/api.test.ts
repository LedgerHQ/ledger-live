import { configureStore } from "@reduxjs/toolkit";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { earnApi, earnApiExtra } from "./api";
import { EARN_REQUEST_TIMEOUT_MS, MAX_RETRIES } from "./constants";

// The staging base URL carries a path, which every request must keep.
const BASE_URL = "https://earn.test/earn";
const PROBE_URL = `${BASE_URL}/probe`;

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(earnApi.endpoints);

describe("earnApi", () => {
  it("has the correct reducer path", () => {
    expect(earnApi.reducerPath).toBe("earnApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("earnApiExtra", () => {
  it("returns the validated config, with the base url trimmed", () => {
    expect(earnApiExtra({ earnApiBaseUrl: ` ${BASE_URL} ` })).toEqual({ earnApiBaseUrl: BASE_URL });
  });

  it("accepts an empty or malformed base url, which disables the service instead of the boot", () => {
    expect(earnApiExtra({ earnApiBaseUrl: "" })).toEqual({ earnApiBaseUrl: "" });
    expect(earnApiExtra({ earnApiBaseUrl: "earn.test" })).toEqual({ earnApiBaseUrl: "earn.test" });
  });
});

// The base query is private, so drive it the way a use case does: through injected endpoints.
function probeStore(extra?: unknown) {
  const api = earnApi.injectEndpoints({
    endpoints: build => ({
      probeRead: build.query<unknown, { timeoutMs?: number } | void>({
        query: arg => ({ url: "/probe", timeoutMs: arg?.timeoutMs }),
      }),
      probeSearch: build.query<unknown, void>({
        query: () => ({ url: "/probe", method: "POST", body: [{ network: "solana" }] }),
      }),
      probeWrite: build.mutation<unknown, void>({
        query: () => ({ url: "/probe", method: "POST", body: {} }),
      }),
    }),
    overrideExisting: true,
  });
  const store = configureStore({
    reducer: { [earnApi.reducerPath]: earnApi.reducer },
    middleware: gdm => gdm({ thunk: { extraArgument: extra } }).concat(earnApi.middleware),
  });
  return { api, store };
}

const configured = () => probeStore(earnApiExtra({ earnApiBaseUrl: BASE_URL }));

const read = jest.fn();
const post = jest.fn();
const server = setupServer(http.get(PROBE_URL, read), http.post(PROBE_URL, post));

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  read.mockReset().mockImplementation(() => HttpResponse.json({ ok: true }));
  post.mockReset().mockImplementation(() => HttpResponse.json({ ok: true }));
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function received(handler: jest.Mock, call = 0): Request {
  return handler.mock.calls[call][0].request;
}

describe("earnBaseQuery", () => {
  it("resolves requests against the configured base url, its path included", async () => {
    const { api, store } = configured();
    const result = await store.dispatch(api.endpoints.probeRead.initiate());

    expect(result.data).toEqual({ ok: true });
    expect(received(read).url).toBe(PROBE_URL);
  });

  it("sends a body as JSON and asks for JSON back", async () => {
    const { api, store } = configured();
    await store.dispatch(api.endpoints.probeSearch.initiate());

    const request = received(post);
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("Accept")).toBe("application/json");
    expect(await request.json()).toEqual([{ network: "solana" }]);
  });

  it("sends a read with no content type, so a browser needs no CORS preflight", async () => {
    const { api, store } = configured();
    await store.dispatch(api.endpoints.probeRead.initiate());

    expect(received(read).headers.get("Content-Type")).toBeNull();
  });

  it("soft-fails without a request when the extraArgument is not configured", async () => {
    const { api, store } = probeStore();
    const result = await store.dispatch(api.endpoints.probeRead.initiate());

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "earnApiExtra not configured in store extraArgument",
    });
    expect(read).not.toHaveBeenCalled();
  });

  it("soft-fails without a request when the base url is empty, which disables the service", async () => {
    const { api, store } = probeStore(earnApiExtra({ earnApiBaseUrl: "" }));
    const result = await store.dispatch(api.endpoints.probeRead.initiate());

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "earnApiBaseUrl is empty: the Earn service is disabled",
    });
    expect(read).not.toHaveBeenCalled();
  });

  it.each(["earn.test", "/earn", "ftp://earn.test"])(
    "soft-fails without a request when the base url %s is not an http(s) URL",
    async earnApiBaseUrl => {
      const { api, store } = probeStore(earnApiExtra({ earnApiBaseUrl }));
      const result = await store.dispatch(api.endpoints.probeRead.initiate());

      expect(result.error).toEqual({
        status: "CUSTOM_ERROR",
        error: "earnApiBaseUrl is not an http(s) URL: the Earn service is disabled",
      });
      expect(read).not.toHaveBeenCalled();
    },
  );
});

describe("earnBaseQuery retries", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends a read again after a network failure", async () => {
    read.mockImplementationOnce(() => HttpResponse.error());

    const { api, store } = configured();
    const pending = store.dispatch(api.endpoints.probeRead.initiate());
    await jest.advanceTimersByTimeAsync(EARN_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result.data).toEqual({ ok: true });
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("sends a POST query again after a server error", async () => {
    post.mockImplementationOnce(() => HttpResponse.json({}, { status: 503 }));

    const { api, store } = configured();
    const pending = store.dispatch(api.endpoints.probeSearch.initiate());
    await jest.advanceTimersByTimeAsync(EARN_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result.data).toEqual({ ok: true });
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("gives up after its last retry and returns the server error", async () => {
    read.mockImplementation(() => HttpResponse.json({}, { status: 503 }));

    const { api, store } = configured();
    const pending = store.dispatch(api.endpoints.probeRead.initiate());
    await jest.advanceTimersByTimeAsync(EARN_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result.error).toMatchObject({ status: 503 });
    expect(read).toHaveBeenCalledTimes(MAX_RETRIES + 1);
  });

  it("does not retry a client error", async () => {
    read.mockImplementation(() => HttpResponse.json({ msg: "bad request" }, { status: 400 }));

    const { api, store } = configured();
    const pending = store.dispatch(api.endpoints.probeRead.initiate());
    await jest.advanceTimersByTimeAsync(EARN_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result.error).toMatchObject({ status: 400 });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("never retries a mutation", async () => {
    post.mockImplementation(() => HttpResponse.json({}, { status: 503 }));

    const { api, store } = configured();
    const pending = store.dispatch(api.endpoints.probeWrite.initiate());
    await jest.advanceTimersByTimeAsync(EARN_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result).toMatchObject({ error: { status: 503 } });
    expect(post).toHaveBeenCalledTimes(1);
  });
});

describe("earnBaseQuery timeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ends a hung request with a TIMEOUT_ERROR after the default timeout, without a retry", async () => {
    read.mockImplementation(() => new Promise(() => {}));

    const { api, store } = configured();
    const pending = store.dispatch(api.endpoints.probeRead.initiate());
    await jest.advanceTimersByTimeAsync(EARN_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result.error).toEqual({
      status: "TIMEOUT_ERROR",
      error: `Timed out after ${EARN_REQUEST_TIMEOUT_MS} ms`,
    });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("bounds an attempt by the timeout the request sets", async () => {
    read.mockImplementation(() => new Promise(() => {}));
    let settled = false;

    const { api, store } = configured();
    const pending = store.dispatch(api.endpoints.probeRead.initiate({ timeoutMs: 20_000 }));
    void pending.then(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(EARN_REQUEST_TIMEOUT_MS);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(20_000 - EARN_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result.error).toEqual({ status: "TIMEOUT_ERROR", error: "Timed out after 20000 ms" });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("clears its timer when the request settles", async () => {
    const { api, store } = configured();
    await store.dispatch(api.endpoints.probeRead.initiate());
    await jest.advanceTimersByTimeAsync(EARN_REQUEST_TIMEOUT_MS);

    expect(received(read).signal.aborted).toBe(false);
  });

  it("aborts the request when the query is cancelled", async () => {
    read.mockImplementation(() => new Promise(() => {}));

    const { api, store } = configured();
    const pending = store.dispatch(api.endpoints.probeRead.initiate());
    await jest.advanceTimersByTimeAsync(0);
    pending.abort();
    await pending;

    expect(received(read).signal.aborted).toBe(true);
    expect(read).toHaveBeenCalledTimes(1);
  });
});
