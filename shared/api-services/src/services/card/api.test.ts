import { configureStore } from "@reduxjs/toolkit";
import { NamedSchemaError } from "@reduxjs/toolkit/query";
import { describeSchemaFailure, getCardExtra, cardApi, cardApiExtra } from "./api";
import type { CardApiExtra } from "./types";

function buildExtra(overrides: Partial<CardApiExtra> = {}): CardApiExtra {
  return {
    getCardApiBaseUrl: () => "https://card.test",
    getCardBaanxClientKey: () => "test-client-key",
    getCardSessionToken: async () => "session-token",
    refreshCardSession: async () => "refreshed-token",
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

describe("cardApi schema failures", () => {
  type Issues = ConstructorParameters<typeof NamedSchemaError>[0];

  /** The error RTK Query hands the converter when a response fails its schema. */
  const rejection = (issues: Issues, value: unknown = { id: "card-1" }) =>
    new NamedSchemaError(issues, value, "responseSchema", undefined);

  it("names the field the response was rejected on", () => {
    // A real rejection from the Card status response: one required string absent.
    const error = describeSchemaFailure(
      rejection([
        { path: ["holderName"], message: "Invalid input: expected string, received undefined" },
      ]),
    );

    expect(error).toEqual({
      status: "CUSTOM_ERROR",
      error:
        "responseSchema rejected the response — holderName: Invalid input: expected string, received undefined",
    });
  });

  it("joins every failing field, so one run reports them all", () => {
    const error = describeSchemaFailure(
      rejection([
        { path: ["holderName"], message: "expected string" },
        { path: ["panLast4"], message: "expected string" },
      ]),
    );

    expect(error).toMatchObject({
      error: expect.stringContaining("holderName: expected string; panLast4: expected string"),
    });
  });

  it("reports a root-level rejection by its message, with no empty field label", () => {
    const error = describeSchemaFailure(
      rejection([{ path: [], message: "Invalid input: expected object, received array" }]),
    );

    expect(error).toMatchObject({
      error:
        "responseSchema rejected the response — Invalid input: expected object, received array",
    });
  });

  it("keeps the rejected value out of the error: it carries the holder's name and PAN", () => {
    const error = describeSchemaFailure(
      rejection([{ path: ["holderName"], message: "expected string" }], {
        holderName: "Ada Lovelace",
        panLast4: "4242",
      }),
    );

    expect(JSON.stringify(error)).not.toContain("Ada Lovelace");
    expect(JSON.stringify(error)).not.toContain("4242");
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

  it("throws when the session accessors are not functions", () => {
    expect(() => cardApiExtra(buildExtra({ getCardSessionToken: undefined }))).toThrow();
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

  // The base query is private, so drive it the way a use case does: through an injected endpoint.
  function probeStore(extra: CardApiExtra) {
    const api = cardApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "/probe" }) }),
      overrideExisting: true,
    });
    const store = configureStore({
      reducer: { [cardApi.reducerPath]: cardApi.reducer },
      middleware: gdm => gdm({ thunk: { extraArgument: extra } }).concat(cardApi.middleware),
    });
    return { api, store };
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
      cardApiExtra(buildExtra({ getCardSessionToken: async () => null })),
    );
    await store.dispatch(api.endpoints.probe.initiate());

    const sent = request(fetchSpy);
    expect(sent.headers.get("authorization")).toBeNull();
    expect(sent.headers.get("x-client-key")).toBe("test-client-key");
  });

  it("refreshes the session once and retries on a 401", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const refreshCardSession = jest.fn(async () => "refreshed-token");

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(refreshCardSession).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({ ok: true });
    expect(request(fetchSpy, 1).headers.get("authorization")).toBe("Bearer refreshed-token");
    expect(request(fetchSpy, 1).headers.get("x-client-key")).toBe("test-client-key");
  });

  it("returns the 401 error when the session cannot be refreshed", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
    const refreshCardSession = jest.fn(async () => null);

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(refreshCardSession).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.error).toMatchObject({ status: 401 });
  });

  it("reports a structured error and sends nothing when the token read rejects", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { api, store } = probeStore(
      cardApiExtra(
        buildExtra({
          getCardSessionToken: async () => {
            throw new Error("keychain unavailable");
          },
        }),
      ),
    );
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.error).toEqual({ status: "CUSTOM_ERROR", error: "keychain unavailable" });
  });

  it("returns the 401 when the refresh rejects", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
    const refreshCardSession = jest.fn(async () => {
      throw new Error("keychain unavailable");
    });

    const { api, store } = probeStore(cardApiExtra(buildExtra({ refreshCardSession })));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(refreshCardSession).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.error).toMatchObject({ status: 401 });
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
