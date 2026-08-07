import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";
import { createTestStore } from "@tests/test-helpers/testUtils";

import { makeQuotesInput, makeRawQuote } from "@domain/api-swap-quotes/fixtures";
import { swapApi } from "@shared/api-services";

import { fetchQuotes } from "./fetchQuotes";

const API_EXTRA = { swapApiBaseUrl: "https://swap.test", ledgerClientVersion: "test-1.0.0" };

// The test store is assembled from the repo helper, whose dispatch type does not carry the
// endpoint's thunk signature. One assertion here keeps it off every call site.
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const asDispatch = (dispatch: unknown) => dispatch as Parameters<typeof fetchQuotes>[2];

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const unauthenticatedProvider = {
  withToken: ({ queryFn }: { queryFn: (token?: unknown) => unknown }) => queryFn(),
} as never;

// `fetchQuotes.test.ts` mocks the endpoint and the store, so it only proves
// wiring; these run against real ones.
describe("fetchQuotes against a live store", () => {
  const server = setupServer();
  let store: ReturnType<typeof createTestStore>;
  let hits: number;

  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    hits = 0;
    store = createTestStore([swapApi], {
      extra: { ...API_EXTRA, authProvider: unauthenticatedProvider },
    });
  });

  function serveOneQuote() {
    server.use(
      http.get("https://swap.test/quote", async () => {
        hits++;
        await delay(20);
        return HttpResponse.json([makeRawQuote()]);
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

  it("returns quotes for repeated identical requests", async () => {
    serveOneQuote();

    const first = await fetchQuotes(args(), "usd", asDispatch(store.dispatch));
    const second = await fetchQuotes(args(), "usd", asDispatch(store.dispatch));
    const third = await fetchQuotes(args(), "usd", asDispatch(store.dispatch));

    expect(first.rawQuotes).toHaveLength(1);
    expect(second.rawQuotes).toHaveLength(1);
    expect(third.rawQuotes).toHaveLength(1);
    expect(hits).toBe(3);
  });

  it("returns quotes to every caller of concurrent identical requests, sharing one call", async () => {
    serveOneQuote();

    const [first, second] = await Promise.all([
      fetchQuotes(args(), "usd", asDispatch(store.dispatch)),
      fetchQuotes(args(), "usd", asDispatch(store.dispatch)),
    ]);

    expect(first.rawQuotes).toHaveLength(1);
    expect(second.rawQuotes).toHaveLength(1);
    expect(hits).toBe(1);
  });

  it("does not retain quote cache entries after the request settles", async () => {
    serveOneQuote();

    await fetchQuotes(args(), "usd", asDispatch(store.dispatch));
    // `keepUnusedDataFor: 0` schedules the eviction on the next macrotask.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(store.getState().swapApi.queries).toEqual({});
  });

  it("returns an empty result when the aggregator answers with an HTTP error", async () => {
    server.use(
      http.get(
        "https://swap.test/quote",
        () => new HttpResponse("<html>502 Bad Gateway</html>", { status: 502 }),
      ),
    );

    await expect(fetchQuotes(args(), "usd", asDispatch(store.dispatch))).resolves.toEqual({
      rawQuotes: [],
      providerErrors: [],
    });
  });

  it("rejects with a named Error when the request never reaches the aggregator", async () => {
    server.use(http.get("https://swap.test/quote", () => HttpResponse.error()));

    await expect(fetchQuotes(args(), "usd", asDispatch(store.dispatch))).rejects.toMatchObject({
      name: "SwapQuotesRequestFailed",
      cause: { status: "FETCH_ERROR" },
    });
  });
});
