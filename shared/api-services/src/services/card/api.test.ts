import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { z } from "zod";
import { cardApi, cardApiExtra, getCardExtra, postCardJson } from "./api";
import { CARD_STALE_REQUEST } from "./constants";
import type { CardApiExtra, CardSessionRefreshResult } from "./types";

const SESSION_ID = 7;

const REPLACED: CardSessionRefreshResult = { kind: "session-replaced" };

function buildExtra(overrides: Partial<CardApiExtra> = {}): CardApiExtra {
  return {
    getCardApiBaseUrl: () => "https://card.test",
    getCardBaanxClientKey: () => "test-client-key",
    readCardSession: async () => ({
      token: "session-token",
      sessionId: SESSION_ID,
    }),
    isCardSessionCurrent: () => true,
    refreshCardSession: async () => REPLACED,
    ...overrides,
  };
}

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(cardApi.endpoints);

let fetchSpy: jest.SpyInstance | undefined;

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
});

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

  it("throws when a session accessor is not a function", () => {
    expect(() => cardApiExtra(buildExtra({ readCardSession: undefined }))).toThrow();
    expect(() => cardApiExtra(buildExtra({ isCardSessionCurrent: undefined }))).toThrow();
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

describe("postCardJson", () => {
  it("sends the client key, no Bearer, and answers with the parsed body", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

    await expect(
      postCardJson(buildExtra(), "/v1/auth/oauth2/token", {
        grant_type: "refresh_token",
      }),
    ).resolves.toEqual({ ok: true });

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const headers = init.headers as Headers;
    expect(url).toBe("https://card.test/v1/auth/oauth2/token");
    expect(init.method).toBe("POST");
    expect(headers.get("x-client-key")).toBe("test-client-key");
    // A grant carries its own proof. It never renews either, so a dead refresh token cannot loop.
    expect(headers.get("authorization")).toBeNull();
  });

  it("throws with the status, and never the body, when the provider refuses", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ error: "invalid_grant", hint: "rt_secret" }, 400));

    const failure = await postCardJson(buildExtra(), "/v1/auth/oauth2/token", {}).catch(
      (error: Error) => error,
    );

    expect(failure).toMatchObject({ name: "CardRequestError" });
    expect(String(failure)).toContain("400");
    expect(String(failure)).not.toContain("rt_secret");
  });

  it("throws, and quotes nothing, when the answer is not JSON", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("<html>rt_secret</html>", { status: 200 }));

    const failure = await postCardJson(buildExtra(), "/v1/auth/oauth2/token", {}).catch(
      (error: Error) => error,
    );

    expect(failure).toMatchObject({ name: "CardRequestError" });
    expect(String(failure)).not.toContain("rt_secret");
  });
});

describe("cardBaseQuery", () => {
  // The base query is private, so drive it the way a use case does: through injected endpoints.
  function probeStore(extra: CardApiExtra) {
    const api = cardApi.injectEndpoints({
      endpoints: build => ({
        probe: build.query<unknown, void>({ query: () => "/probe" }),
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

  it("renews nothing when the answer is not a 401", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 500));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number, string]>(
      async () => REPLACED,
    );

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(refreshCardSession).not.toHaveBeenCalled();
    expect(result.error).toMatchObject({ status: 500 });
  });

  it("renews nothing when the request carried no token", async () => {
    // Nothing to renew, and nothing to end: a 401 without a Bearer says only that one is needed.
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number, string]>(
      async () => REPLACED,
    );

    const { api, store } = probeStore(
      cardApiExtra(
        buildExtra({
          readCardSession: async () => ({ token: null, sessionId: 0 }),
          refreshCardSession,
        }),
      ),
    );
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(request(fetchSpy).headers.get("authorization")).toBeNull();
    expect(request(fetchSpy).headers.get("x-client-key")).toBe("test-client-key");
    expect(refreshCardSession).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.error).toMatchObject({ status: 401 });
  });

  it("renews the session once and replays the same request on a 401", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number, string]>(
      async () => ({
        kind: "refreshed",
        accessToken: "refreshed-token",
      }),
    );

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    // The session id names the session the request was sent with, so the owner can tell a renewal
    // from a request that outlived its session.
    expect(refreshCardSession).toHaveBeenCalledWith(SESSION_ID, "session-token");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({ ok: true });
    expect(request(fetchSpy, 1).url).toBe("https://card.test/probe");
    expect(request(fetchSpy, 1).headers.get("authorization")).toBe("Bearer refreshed-token");
  });

  it("replays only once, so a second 401 is the answer", async () => {
    // A fresh Response per call: a body can only be read once.
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse({}, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number, string]>(
      async () => ({
        kind: "refreshed",
        accessToken: "refreshed-token",
      }),
    );

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(refreshCardSession).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.error).toMatchObject({ status: 401 });
  });

  it("discards a replay response when the session is replaced in flight", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ private: "old-user" }));
    const isCardSessionCurrent = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);

    const { api, store } = probeStore(
      cardApiExtra(
        buildExtra({
          isCardSessionCurrent,
          refreshCardSession: async () => ({
            kind: "refreshed",
            accessToken: "refreshed-token",
          }),
        }),
      ),
    );
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.data).toBeUndefined();
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: CARD_STALE_REQUEST,
    });
  });

  it("answers an ended session with the 401 the provider sent, and sends nothing more", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse({ message: "unauthorized" }, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number, string]>(
      async () => ({
        kind: "session-ended",
      }),
    );

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.error).toEqual({
      status: 401,
      data: { message: "unauthorized" },
    });
  });

  it("answers a replaced session with a stale-request error, not a 401", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
    const refreshCardSession = jest.fn<Promise<CardSessionRefreshResult>, [number, string]>(
      async () => REPLACED,
    );

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // A 401 here would end the session a newer login just started, for somebody else.
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: CARD_STALE_REQUEST,
    });
  });

  it("keeps a rejected renewal error out of the RTK Query result", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));

    const { api, store } = probeStore(
      cardApiExtra(
        buildExtra({
          refreshCardSession: async () => {
            throw new Error("sensitive-token");
          },
        }),
      ),
    );
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "Card session renew failed",
    });
    expect(JSON.stringify(result)).not.toContain("sensitive-token");
  });

  it("discards a successful response when another session replaced its credentials", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ private: "old-user" }));
    const isCardSessionCurrent = jest.fn().mockReturnValueOnce(true).mockReturnValue(false);

    const { api, store } = probeStore(cardApiExtra(buildExtra({ isCardSessionCurrent })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.data).toBeUndefined();
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: CARD_STALE_REQUEST,
    });
  });

  it("reports a structured error and sends nothing when the session read rejects", async () => {
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

    // A keychain the OS refused is not an absent session, and an absent session ends one.
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "Card session read failed",
    });
  });

  it("puts no request metadata, and no token, into any action", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

    const { api, store, actions } = probeStore(cardApiExtra(buildExtra()));
    await store.dispatch(api.endpoints.probe.initiate());

    // RTK copies the base query's `meta` into `meta.baseQueryMeta` of the settled action, and a
    // plain `fetchBaseQuery` reports the whole `Request` there, whose headers carry the Bearer.
    const fulfilled = actions.find(action => action.type.endsWith("/executeQuery/fulfilled"));
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const meta = (fulfilled as unknown as { meta: { baseQueryMeta: unknown } }).meta;
    expect(meta.baseQueryMeta).toBeUndefined();
    expect(JSON.stringify(actions)).not.toContain("session-token");
  });

  describe("catchSchemaFailure", () => {
    it("names the schema and drops the value that failed", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(jsonResponse({ token: "short" }));

      const { api, store } = probeStore(cardApiExtra(buildExtra()));
      const result = await store.dispatch(api.endpoints.probeWithSchema.initiate());

      expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
      expect(JSON.stringify(result.error)).toContain("responseSchema");
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
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return spy.mock.calls[callIndex][0] as Request;
}
