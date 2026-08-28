import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { z } from "zod";
import { getCardExtra, cardApi, cardApiExtra } from "./api";
import { CARD_RENEWAL_UNAVAILABLE, CARD_SESSION_ENDED } from "./constants";
import { isCardRenewalUnavailable, isCardSessionEnded, isCardUnauthorized } from "./errors";
import type { CardApiExtra, CardSessionRefreshResult } from "./types";

const UNAVAILABLE: CardSessionRefreshResult = {
  kind: "unavailable",
  error: { status: 503, message: "no renewal configured" },
};

const SESSION_EPOCH = 7;

function buildExtra(overrides: Partial<CardApiExtra> = {}): CardApiExtra {
  return {
    getCardApiBaseUrl: () => "https://card.test",
    getCardBaanxClientKey: () => "test-client-key",
    readCardSession: async () => ({ token: "session-token", epoch: SESSION_EPOCH }),
    getCardRefreshToken: async () => "refresh-token",
    takeCardAuthorizationGrant: () => null,
    receiveCardSession: () => "card-session-1",
    refreshCardSession: async () => UNAVAILABLE,
    ...overrides,
  };
}

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(cardApi.endpoints);

describe("cardApi", () => {
  it("has the correct reducer path", () => {
    expect(cardApi.reducerPath).toBe("cardApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("cardApiExtra", () => {
  it("returns the validated config", () => {
    const extra = buildExtra();
    expect(cardApiExtra(extra)).toEqual(extra);
  });

  it("throws when the config accessors are not functions", () => {
    expect(() => cardApiExtra(buildExtra({ getCardApiBaseUrl: undefined }))).toThrow();
    expect(() => cardApiExtra(buildExtra({ getCardBaanxClientKey: undefined }))).toThrow();
  });

  it("throws when any session accessor is not a function", () => {
    expect(() => cardApiExtra(buildExtra({ readCardSession: undefined }))).toThrow();
    expect(() => cardApiExtra(buildExtra({ getCardRefreshToken: undefined }))).toThrow();
    expect(() => cardApiExtra(buildExtra({ takeCardAuthorizationGrant: undefined }))).toThrow();
    expect(() => cardApiExtra(buildExtra({ receiveCardSession: undefined }))).toThrow();
    expect(() => cardApiExtra(buildExtra({ refreshCardSession: undefined }))).toThrow();
  });

  it("accepts an empty Baanx client key (provisioned later via CARD_BAANX_CLIENT_KEY)", () => {
    expect(
      cardApiExtra(buildExtra({ getCardBaanxClientKey: () => "" })).getCardBaanxClientKey(),
    ).toBe("");
  });
});

describe("getCardExtra", () => {
  it("reads the config off the thunk extraArgument", () => {
    const extra = buildExtra();
    expect(getCardExtra({ extra })).toBe(extra);
  });
});

describe("cardBaseQuery", () => {
  let fetchSpy: jest.SpyInstance;

  // The base query is private, so drive it the way a use case does: through injected endpoints.
  function probeStore(extra: CardApiExtra) {
    const api = cardApi.injectEndpoints({
      endpoints: build => ({
        probe: build.query<unknown, void>({ query: () => "/probe" }),
        probeUnauthenticated: build.query<unknown, void>({
          query: () => "/probe",
          extraOptions: { authenticated: false },
        }),
        probeWithSchema: build.query<{ token: string }, void>({
          query: () => "/probe",
          responseSchema: z.object({ token: z.string().min(20) }),
        }),
      }),
      overrideExisting: true,
    });
    const actions: UnknownAction[] = [];
    const record: Middleware = () => next => action => {
      actions.push(action as UnknownAction);
      return next(action);
    };
    const store = configureStore({
      reducer: { [cardApi.reducerPath]: cardApi.reducer },
      middleware: gdm =>
        gdm({ thunk: { extraArgument: extra } })
          .concat(cardApi.middleware)
          .concat(record),
    });
    return { api, store, actions };
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("resolves requests against the configured base url with a Bearer token", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

    const { api, store } = probeStore(cardApiExtra(buildExtra()));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    const sent = request(fetchSpy);
    expect(sent.url).toBe("https://card.test/probe");
    expect(sent.headers.get("authorization")).toBe("Bearer session-token");
    expect(sent.headers.get("x-client-key")).toBe("test-client-key");
  });

  it("reads the base url and the client key again on every request", async () => {
    // The debug settings change the two envs while the app runs. The store holds the accessors, so
    // the next request must carry the new values without a restart.
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    let baseUrl = "https://card.first";
    let clientKey = "first-key";

    const { api, store } = probeStore(
      cardApiExtra(
        buildExtra({ getCardApiBaseUrl: () => baseUrl, getCardBaanxClientKey: () => clientKey }),
      ),
    );
    await store.dispatch(api.endpoints.probe.initiate());

    baseUrl = "https://card.second";
    clientKey = "second-key";
    await store.dispatch(api.endpoints.probe.initiate(undefined, { forceRefetch: true }));

    expect(request(fetchSpy, 0).url).toBe("https://card.first/probe");
    expect(request(fetchSpy, 0).headers.get("x-client-key")).toBe("first-key");
    expect(request(fetchSpy, 1).url).toBe("https://card.second/probe");
    expect(request(fetchSpy, 1).headers.get("x-client-key")).toBe("second-key");
  });

  it("sends x-client-key and omits Authorization when no session token is available", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { api, store } = probeStore(
      cardApiExtra(buildExtra({ readCardSession: async () => ({ token: null, epoch: 0 }) })),
    );
    await store.dispatch(api.endpoints.probe.initiate());

    const sent = request(fetchSpy);
    expect(sent.headers.get("authorization")).toBeNull();
    expect(sent.headers.get("x-client-key")).toBe("test-client-key");
  });

  it("renews the session once and replays on a 401", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number]>(async () => ({
      kind: "refreshed",
      accessToken: "refreshed-token",
    }));

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    // The epoch names the session the request was sent with, so the owner can tell a renewal from
    // a request that outlived its session.
    expect(refreshCardSession).toHaveBeenCalledWith(SESSION_EPOCH);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({ ok: true });
    expect(request(fetchSpy, 1).headers.get("authorization")).toBe("Bearer refreshed-token");
    expect(request(fetchSpy, 1).headers.get("x-client-key")).toBe("test-client-key");
  });

  it("replays only once, so a second 401 is the answer", async () => {
    // A fresh Response per call: a body can only be read once.
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse({}, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number]>(async () => ({
      kind: "refreshed",
      accessToken: "refreshed-token",
    }));

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(refreshCardSession).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.error).toMatchObject({ status: 401 });
  });

  it("answers a session-ended renewal with a 401 and sends nothing more", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse({}, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number]>(async () => ({
      kind: "session-ended",
    }));

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.error).toEqual({
      status: 401,
      data: { message: CARD_SESSION_ENDED },
    });
    expect(isCardSessionEnded(result.error)).toBe(true);
    expect(isCardRenewalUnavailable(result.error)).toBe(false);
  });

  it("names a renewal it could not run, so a 5xx does not end a session", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number]>(
      async () => UNAVAILABLE,
    );

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(refreshCardSession).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.error).toMatchObject({
      status: 401,
      data: {
        message: CARD_RENEWAL_UNAVAILABLE,
        reason: "renewal_failed",
        cause: "no renewal configured",
        status: 503,
      },
    });
    // Still a 401, and still not a reason to sign anybody out.
    expect(isCardUnauthorized(result.error)).toBe(true);
    expect(isCardRenewalUnavailable(result.error)).toBe(true);
    expect(isCardSessionEnded(result.error)).toBe(false);
  });

  it("neither replays nor cleans up for a request that outlived its session", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number]>(async () => ({
      kind: "session-replaced",
    }));

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.error).toMatchObject({
      status: 401,
      data: { message: CARD_RENEWAL_UNAVAILABLE, reason: "session_replaced" },
    });
    expect(isCardRenewalUnavailable(result.error)).toBe(true);
  });

  it("reports a structured error and sends nothing when the token read rejects", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { api, store } = probeStore(
      cardApiExtra(
        buildExtra({
          readCardSession: async () => {
            throw new Error("keychain unavailable");
          },
        }),
      ),
    );
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.error).toEqual({ status: "CUSTOM_ERROR", error: "keychain unavailable" });
  });

  it("names a renewal that threw, and keeps the session", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number]>(async () => {
      throw new Error("keychain unavailable");
    });

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(refreshCardSession).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.error).toMatchObject({
      status: 401,
      data: { message: CARD_RENEWAL_UNAVAILABLE, reason: "renewal_threw" },
    });
  });

  it("never puts the Request, whose headers carry the Bearer, into an action", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

    const { api, store, actions } = probeStore(cardApiExtra(buildExtra()));
    await store.dispatch(api.endpoints.probe.initiate());

    // RTK copies the base query's `meta` into `meta.baseQueryMeta` of the settled action, which
    // the desktop log export writes to disk and the mobile DevTools relay sends over a socket.
    const fulfilled = actions.find(action => action.type.endsWith("/executeQuery/fulfilled"));
    expect(fulfilled).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    expect(
      (fulfilled as unknown as { meta: { baseQueryMeta: unknown } }).meta.baseQueryMeta,
    ).toEqual({
      requestUrl: "https://card.test/probe",
      requestMethod: "GET",
      responseStatus: 200,
    });
    expect(JSON.stringify(actions)).not.toContain("session-token");
  });

  describe("authenticated: false", () => {
    it("sends x-client-key, reads no token and omits Authorization", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));
      const readCardSession = jest.fn(async () => ({
        token: "session-token",
        epoch: SESSION_EPOCH,
      }));

      const { api, store } = probeStore(cardApiExtra(buildExtra({ readCardSession })));
      await store.dispatch(api.endpoints.probeUnauthenticated.initiate());

      expect(readCardSession).not.toHaveBeenCalled();
      const sent = request(fetchSpy);
      expect(sent.headers.get("authorization")).toBeNull();
      expect(sent.headers.get("x-client-key")).toBe("test-client-key");
    });

    it("never renews on a 401, so a dead refresh token cannot loop", async () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
      const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number]>(async () => ({
        kind: "refreshed",
        accessToken: "refreshed-token",
      }));

      const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
      const result = await store.dispatch(api.endpoints.probeUnauthenticated.initiate());

      expect(refreshCardSession).not.toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.error).toMatchObject({ status: 401 });
    });
  });

  describe("catchSchemaFailure", () => {
    it("names the schema and drops the value that failed", async () => {
      const token = "a-sentinel-access-token";
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse({ token: "short" }));

      const { api, store } = probeStore(cardApiExtra(buildExtra()));
      const result = await store.dispatch(api.endpoints.probeWithSchema.initiate());

      expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
      expect(JSON.stringify(result.error)).toContain("responseSchema");
      expect(JSON.stringify(result.error)).not.toContain(token);
      expect(JSON.stringify(result.error)).not.toContain("short");
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function request(spy: jest.SpyInstance, callIndex = 0): Request {
  return spy.mock.calls[callIndex][0] as Request;
}
