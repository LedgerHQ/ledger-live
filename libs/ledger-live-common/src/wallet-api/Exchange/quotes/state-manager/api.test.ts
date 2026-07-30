import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";
import { createTestStore } from "@tests/test-helpers/testUtils";
import { getEnv, setEnv } from "@shared/env";

import { makeQuotesInput } from "../fixtures/quotesInput";
import { fetchQuotes } from "../service/fetchQuotes";
import { ProviderErrorCodes } from "../types";
import type { RawQuote, RawQuoteError } from "../service/types";
import { buildQuotesParams, splitQuotes, swapQuotesApi, transformFetchQuotesResponse } from "./api";
import { setSwapQuotesStore } from "./store";

jest.mock("../../../../exchange/swap", () => ({
  getSwapAPIBaseURL: jest.fn(() => "https://swap.test"),
}));

describe("buildQuotesParams", () => {
  it("maps the resolved input to the aggregator query params", () => {
    const params = buildQuotesParams(["lifi", "okx"], makeQuotesInput(), "usd");

    expect(params).toMatchObject({
      amountFrom: "100000000",
      "providers-whitelist": "lifi,okx",
      from: "bitcoin",
      to: "ethereum",
      fromAccountId: "send-account",
      addressFrom: "0xfrom",
      addressTo: "0xto",
      fiatForCounterValue: "usd",
      currencyTicker: "usd",
      uniswapOrderType: "classic",
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const rawQuote = { provider: "lifi", key: "lifi-key" } as RawQuote;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const providerError = {
      code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
      provider: "okx",
    } as RawQuoteError;

    expect(splitQuotes([rawQuote, providerError])).toEqual({
      rawQuotes: [rawQuote],
      providerErrors: [providerError],
    });
  });
});

describe("transformFetchQuotesResponse", () => {
  it("splits the rows of an array body", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const rawQuote = { provider: "lifi", key: "lifi-key" } as RawQuote;

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

  beforeAll(() => server.listen());
  afterEach(() => {
    store.dispatch(swapQuotesApi.util.resetApiState());
    server.resetHandlers();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    store = createTestStore([swapQuotesApi]);
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
    const rawQuote = { provider: "lifi", key: "lifi-key" };
    const providerError = { code: ProviderErrorCodes.AMOUNT_OFF_LIMITS, provider: "okx" };
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

  it("sends X-Ledger-Client-Version when the env is set", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );
    const previous = getEnv("LEDGER_CLIENT_VERSION");
    setEnv("LEDGER_CLIENT_VERSION", "test-3.2.1");

    try {
      await initiate();
    } finally {
      setEnv("LEDGER_CLIENT_VERSION", previous);
    }

    expect(seen!.headers.get("X-Ledger-Client-Version")).toBe("test-3.2.1");
  });

  it("omits X-Ledger-Client-Version when the env is unset", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );

    await initiate();

    expect(seen!.headers.has("X-Ledger-Client-Version")).toBe(false);
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

    // Two different tokens collapse to a single cache entry, and neither
    // appears in its key.
    const keys = Object.keys(store.getState().swapQuotesApi.queries);
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

  it("reports a non-2xx non-JSON body as an error carrying the HTTP status", async () => {
    // Aggregator 5xx responses often carry a non-JSON body, which surfaces as a
    // PARSING_ERROR with `originalStatus`. HTTP errors stay errors here so the
    // auth adapter's 401/403 refresh-and-retry can fire; `fetchQuotes` is what
    // maps them to the legacy empty result.
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

describe("fetchQuotes against a live store", () => {
  const server = setupServer();
  let store: ReturnType<typeof createTestStore>;
  let hits: number;

  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    // The dispatch is registered on globalThis; drop the reference to this
    // suite's discarded store.
    globalThis.__ledgerSwapQuotesDispatch = undefined;
  });
  afterAll(() => server.close());

  beforeEach(() => {
    hits = 0;
    store = createTestStore([swapQuotesApi]);
    setSwapQuotesStore(store.dispatch);
  });

  function serveOneQuote() {
    server.use(
      http.get("https://swap.test/quote", async () => {
        hits++;
        await delay(20);
        return HttpResponse.json([{ provider: "lifi", key: "lifi-key" }]);
      }),
    );
  }

  function args() {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
      providers: ["lifi"],
      data: makeQuotesInput(),
    } as Parameters<typeof fetchQuotes>[0];
  }

  // Regression: with `subscribe: false` the cache entry `keepUnusedDataFor: 0`
  // evicts could be gone before the promise resolved, so a repeated request
  // returned zero quotes despite a successful response.
  it("returns quotes for repeated identical requests", async () => {
    serveOneQuote();

    const first = await fetchQuotes(args(), "usd");
    const second = await fetchQuotes(args(), "usd");
    const third = await fetchQuotes(args(), "usd");

    expect(first.rawQuotes).toHaveLength(1);
    expect(second.rawQuotes).toHaveLength(1);
    expect(third.rawQuotes).toHaveLength(1);
    expect(hits).toBe(3);
  });

  it("returns quotes to every caller of concurrent identical requests", async () => {
    serveOneQuote();

    const [first, second] = await Promise.all([
      fetchQuotes(args(), "usd"),
      fetchQuotes(args(), "usd"),
    ]);

    expect(first.rawQuotes).toHaveLength(1);
    expect(second.rawQuotes).toHaveLength(1);
    // RTK Query de-duplicates the in-flight request, so both callers share one.
    expect(hits).toBe(1);
  });

  it("does not retain quote cache entries after the request settles", async () => {
    serveOneQuote();

    await fetchQuotes(args(), "usd");
    // `keepUnusedDataFor: 0` schedules the eviction on the next macrotask.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(store.getState().swapQuotesApi.queries).toEqual({});
  });

  it("returns an empty result when the aggregator answers with an HTTP error", async () => {
    server.use(
      http.get(
        "https://swap.test/quote",
        () => new HttpResponse("<html>502 Bad Gateway</html>", { status: 502 }),
      ),
    );

    await expect(fetchQuotes(args(), "usd")).resolves.toEqual({
      rawQuotes: [],
      providerErrors: [],
    });
  });

  it("rejects with a named Error when the request never reaches the aggregator", async () => {
    server.use(http.get("https://swap.test/quote", () => HttpResponse.error()));

    await expect(fetchQuotes(args(), "usd")).rejects.toMatchObject({
      name: "SwapQuotesRequestFailed",
      cause: { status: "FETCH_ERROR" },
    });
  });
});
