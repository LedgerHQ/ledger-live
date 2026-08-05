import { configureStore } from "@reduxjs/toolkit";
import { getSwapExtra, swapApi, swapApiExtra } from "./api";

const valid = { swapApiBaseUrl: "https://swap.test", ledgerClientVersion: "1.2.3" };

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(swapApi.endpoints);

describe("swapApi", () => {
  it("has the correct reducer path", () => {
    expect(swapApi.reducerPath).toBe("swapApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("swapApiExtra", () => {
  it("returns the validated config", () => {
    expect(swapApiExtra(valid)).toEqual(valid);
  });

  // The env vars behind these resolve at app init; an empty one is a
  // misconfiguration that should fail loudly there rather than produce
  // requests against a bare path at the first quote.
  it("throws when the base url is missing or blank", () => {
    // @ts-expect-error — swapApiBaseUrl is required
    expect(() => swapApiExtra({ ledgerClientVersion: "1.2.3" })).toThrow();
    expect(() => swapApiExtra({ ...valid, swapApiBaseUrl: "" })).toThrow();
  });

  it("throws when the client version is missing or blank", () => {
    // @ts-expect-error — ledgerClientVersion is required
    expect(() => swapApiExtra({ swapApiBaseUrl: "https://swap.test" })).toThrow();
    expect(() => swapApiExtra({ ...valid, ledgerClientVersion: "" })).toThrow();
  });
});

describe("getSwapExtra", () => {
  it("reads this service's slice out of the thunk extraArgument", () => {
    expect(getSwapExtra({ extra: { ...valid, somethingElse: true } })).toMatchObject(valid);
  });
});

describe("swapBaseQuery", () => {
  let fetchSpy: jest.SpyInstance;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const unauthenticatedProvider = {
    withToken: ({ queryFn }: { queryFn: (token?: unknown) => unknown }) => queryFn(),
  } as never;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const tokenProvider = (accessToken: string) =>
    ({
      withToken: ({ queryFn }: { queryFn: (token?: unknown) => unknown }) =>
        queryFn({ tokenType: "Bearer", accessToken }),
    }) as never;

  // The base query is private, so drive it the way a use case does: through an injected endpoint.
  function probeStore(extra?: unknown) {
    const api = swapApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "/probe" }) }),
      overrideExisting: true,
    });
    const store = configureStore({
      reducer: { [swapApi.reducerPath]: swapApi.reducer },
      middleware: gdm =>
        gdm({ serializableCheck: false, thunk: { extraArgument: extra } }).concat(
          swapApi.middleware,
        ),
    });
    return { api, store };
  }

  function mockJsonResponse() {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("resolves requests against the configured base url, with the client-version header", async () => {
    mockJsonResponse();

    const { api, store } = probeStore({
      ...swapApiExtra(valid),
      authProvider: unauthenticatedProvider,
    });
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toBe("https://swap.test/probe");
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  // This service is the first consumer of `createAuthenticatedBaseQuery` outside `shared/auth`,
  // so both branches of the wrapper have to keep this service's own `prepareHeaders`.
  it("keeps the client-version header on the authenticated branch too", async () => {
    mockJsonResponse();

    const { api, store } = probeStore({
      ...swapApiExtra(valid),
      authProvider: tokenProvider("tok-123"),
    });
    await store.dispatch(api.endpoints.probe.initiate());

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
    expect(request.headers.get("authorization")).toBe("Bearer tok-123");
  });

  it("sends no Authorization header while no token is yielded", async () => {
    mockJsonResponse();

    const { api, store } = probeStore({
      ...swapApiExtra(valid),
      authProvider: unauthenticatedProvider,
    });
    await store.dispatch(api.endpoints.probe.initiate());

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.headers.has("authorization")).toBe(false);
  });
});
