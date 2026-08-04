import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { swapApi } from "@shared/api-services";

import { makeQuotesInput } from "./fixtures/quotesInput";
import { makeRawQuote, makeRawQuoteError } from "./fixtures/rawQuotes";
import { buildQuotesParams, splitQuotes, swapQuotesApi, transformFetchQuotesResponse } from "./api";

const EXTRA = { swapApiBaseUrl: "https://swap.test", ledgerClientVersion: "test-3.2.1" };

function createTestStore(extra: unknown) {
  return configureStore({
    reducer: { [swapApi.reducerPath]: swapApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: { extraArgument: extra },
      }).concat(swapApi.middleware),
  });
}

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

describe("buildQuotesParams", () => {
  it("maps the resolved input to exactly the aggregator query params", () => {
    const params = buildQuotesParams(["lifi", "okx"], makeQuotesInput(), "usd");

    expect(params).toEqual({
      amountFrom: "100000000",
      displayLanguage: "en",
      lang: "en",
      theme: "dark",
      "providers-whitelist": "lifi,okx",
      fiatForCounterValue: "usd",
      currencyTicker: "usd",
      networkFees: "0",
      uniswapOrderType: "classic",
      from: "bitcoin",
      to: "ethereum",
      fromAccountId: "send-account",
      addressFrom: "0xfrom",
      addressTo: "0xto",
    });
  });

  it("includes optional network fees currency and slippage when provided", () => {
    const params = buildQuotesParams(
      ["lifi"],
      makeQuotesInput({ networkFeesCurrencyId: "ethereum", slippage: 0.5 }),
      "usd",
    );

    expect(params.networkFeesCurrency).toBe("ethereum");
    expect(params.slippage).toBe("0.5");
  });

  it("omits optional params when absent", () => {
    const params = buildQuotesParams(["lifi"], makeQuotesInput(), "usd");

    expect(params).not.toHaveProperty("networkFeesCurrency");
    expect(params).not.toHaveProperty("slippage");
  });
});

describe("splitQuotes", () => {
  it("splits successful quote rows from provider error rows", () => {
    const rawQuote = makeRawQuote();
    const providerError = makeRawQuoteError();

    expect(splitQuotes([rawQuote, providerError])).toEqual({
      rawQuotes: [rawQuote],
      providerErrors: [providerError],
    });
  });
});

describe("transformFetchQuotesResponse", () => {
  it("splits the rows of an array body", () => {
    const rawQuote = makeRawQuote();

    expect(transformFetchQuotesResponse([rawQuote])).toEqual({
      rawQuotes: [rawQuote],
      providerErrors: [],
    });
  });

  it("returns an empty result when the body is not an array", () => {
    expect(transformFetchQuotesResponse({ unexpected: true })).toEqual({
      rawQuotes: [],
      providerErrors: [],
    });
  });
});

describe("swapQuotesApi.fetchQuotes (integration)", () => {
  const server = setupServer();
  let store: ReturnType<typeof createTestStore>;

  beforeAll(() => {
    server.listen();
  });
  afterEach(() => {
    store.dispatch(swapQuotesApi.util.resetApiState());
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    // Both apps register a provider, so the missing-provider fallback is not
    // the path production takes.
    store = createTestStore({ ...EXTRA, authProvider: unauthenticatedProvider });
  });

  function initiate() {
    return store.dispatch(
      swapQuotesApi.endpoints.fetchQuotes.initiate(
        { providers: ["lifi", "okx"], quotesInput: makeQuotesInput(), counterValueCurrency: "usd" },
        { forceRefetch: true },
      ),
    );
  }

  it("splits the rows on a 2xx JSON response", async () => {
    const rawQuote = makeRawQuote();
    const providerError = makeRawQuoteError();
    server.use(
      http.get("https://swap.test/quote", () => HttpResponse.json([rawQuote, providerError])),
    );

    const result = await initiate();

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ rawQuotes: [rawQuote], providerErrors: [providerError] });
  });

  it("puts the built params and the Accept header on the wire", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );

    await initiate();

    const url = new URL(seen!.url);
    expect(url.pathname).toBe("/quote");
    expect(url.searchParams.get("from")).toBe("bitcoin");
    expect(url.searchParams.get("to")).toBe("ethereum");
    expect(url.searchParams.get("providers-whitelist")).toBe("lifi,okx");
    expect(url.searchParams.get("fiatForCounterValue")).toBe("usd");
    expect(seen!.headers.get("accept")).toBe("application/json");
  });

  it("sends X-Ledger-Client-Version from the injected config", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );

    await initiate();

    expect(seen!.headers.get("X-Ledger-Client-Version")).toBe("test-3.2.1");
  });

  it("sends no Authorization header while the auth flag is off", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );

    await initiate();

    expect(seen!.headers.has("authorization")).toBe(false);
  });

  it("sends the bearer token once the auth provider yields one", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );
    const authedStore = createTestStore({ ...EXTRA, authProvider: tokenProvider("tok-123") });

    await authedStore.dispatch(
      swapQuotesApi.endpoints.fetchQuotes.initiate(
        { providers: ["lifi"], quotesInput: makeQuotesInput(), counterValueCurrency: "usd" },
        { forceRefetch: true },
      ),
    );

    expect(seen!.headers.get("authorization")).toBe("Bearer tok-123");
  });

  it("resolves the request against the injected base url", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );

    await initiate();

    expect(new URL(seen!.url).origin).toBe("https://swap.test");
  });

  it("keeps customHeaders out of the cache key", async () => {
    server.use(http.get("https://swap.test/quote", () => HttpResponse.json([])));

    const base = {
      providers: ["lifi"],
      quotesInput: makeQuotesInput(),
      counterValueCurrency: "usd",
    };
    await store.dispatch(
      swapQuotesApi.endpoints.fetchQuotes.initiate(
        { ...base, customHeaders: { "x-token": "secret-one" } },
        { forceRefetch: true },
      ),
    );
    await store.dispatch(
      swapQuotesApi.endpoints.fetchQuotes.initiate(
        { ...base, customHeaders: { "x-token": "secret-two" } },
        { forceRefetch: true },
      ),
    );

    const keys = Object.keys(store.getState().swapApi.queries);
    expect(keys).toHaveLength(1);
    expect(keys[0]).not.toContain("x-token");
    expect(keys[0]).not.toContain("secret");
  });

  it("lets caller-supplied headers override the defaults", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );

    await store.dispatch(
      swapQuotesApi.endpoints.fetchQuotes.initiate(
        {
          providers: ["lifi"],
          quotesInput: makeQuotesInput(),
          counterValueCurrency: "usd",
          customHeaders: { Accept: "text/plain", "x-foo": "bar" },
        },
        { forceRefetch: true },
      ),
    );

    expect(seen!.headers.get("accept")).toBe("text/plain");
    expect(seen!.headers.get("x-foo")).toBe("bar");
  });

  it("reports a non-2xx non-JSON body as a PARSING_ERROR carrying the original status", async () => {
    server.use(
      http.get(
        "https://swap.test/quote",
        () => new HttpResponse("<html>502 Bad Gateway</html>", { status: 502 }),
      ),
    );

    const result = await initiate();

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ status: "PARSING_ERROR", originalStatus: 502 });
  });

  it("reports a non-2xx JSON body as an error carrying the HTTP status", async () => {
    server.use(
      http.get("https://swap.test/quote", () =>
        HttpResponse.json({ message: "bad request" }, { status: 400 }),
      ),
    );

    const result = await initiate();

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ status: 400 });
  });

  it("rejects with an error on a transport failure", async () => {
    server.use(http.get("https://swap.test/quote", () => HttpResponse.error()));

    const result = await initiate();

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ status: "FETCH_ERROR" });
  });
});
