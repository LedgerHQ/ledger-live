import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { swapQuotesApi } from "../api";
import { makeQuotesInput } from "../fixtures/quotesInput";
import { makeRawQuote } from "../fixtures/rawQuotes";
import { getSwapQuotesDispatch, resetSwapQuotesStore } from "./store";
import { setupStandaloneSwapQuotesStore } from "./store.standalone";

const API_EXTRA = { swapApiBaseUrl: "https://swap.test", ledgerClientVersion: "test-1.0.0" };

describe("setupStandaloneSwapQuotesStore", () => {
  const server = setupServer();

  beforeAll(() => server.listen());
  beforeEach(() => {
    // Reset so the "throws before setup" assertion doesn't depend on the order
    // of the tests in this file.
    resetSwapQuotesStore();
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("registers the store dispatch for getSwapQuotesDispatch", () => {
    expect(() => getSwapQuotesDispatch()).toThrow(/Swap quotes store is not set/);

    const store = setupStandaloneSwapQuotesStore(API_EXTRA);

    expect(getSwapQuotesDispatch()).toBe(store.dispatch);
  });

  it("rejects a config whose values resolved to empty strings", () => {
    expect(() => setupStandaloneSwapQuotesStore({ ...API_EXTRA, swapApiBaseUrl: "" })).toThrow();
  });

  it("wires a working store the fetchQuotes endpoint can run against", async () => {
    const rawQuote = makeRawQuote();
    server.use(http.get("https://swap.test/quote", () => HttpResponse.json([rawQuote])));

    setupStandaloneSwapQuotesStore(API_EXTRA);
    const dispatch = getSwapQuotesDispatch();

    const result = (await dispatch(
      swapQuotesApi.endpoints.fetchQuotes.initiate(
        { providers: ["lifi"], quotesInput: makeQuotesInput(), counterValueCurrency: "usd" },
        { forceRefetch: true },
      ),
    )) as { data?: unknown; error?: unknown };

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ rawQuotes: [rawQuote], providerErrors: [] });
  });

  it("sends the request unauthenticated, since headless consumers have no session", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://swap.test/quote", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );

    setupStandaloneSwapQuotesStore(API_EXTRA);
    await getSwapQuotesDispatch()(
      swapQuotesApi.endpoints.fetchQuotes.initiate(
        { providers: ["lifi"], quotesInput: makeQuotesInput(), counterValueCurrency: "usd" },
        { forceRefetch: true },
      ),
    );

    expect(seen!.headers.has("authorization")).toBe(false);
  });
});
