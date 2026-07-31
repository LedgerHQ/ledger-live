import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { makeQuotesInput } from "../fixtures/quotesInput";
import { makeRawQuote } from "../fixtures/rawQuotes";
import { getSwapQuotesDispatch, resetSwapQuotesStore } from "./store";
import { swapQuotesApi } from "./api";
import { setupStandaloneSwapQuotesStore } from "./standaloneStore";

jest.mock("../../../../exchange/swap", () => ({
  getSwapAPIBaseURL: jest.fn(() => "https://swap.test"),
}));

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

    const store = setupStandaloneSwapQuotesStore();

    expect(getSwapQuotesDispatch()).toBe(store.dispatch);
  });

  it("wires a working store the fetchQuotes endpoint can run against", async () => {
    const rawQuote = makeRawQuote();
    server.use(http.get("https://swap.test/quote", () => HttpResponse.json([rawQuote])));

    setupStandaloneSwapQuotesStore();
    const dispatch = getSwapQuotesDispatch();

    const result = (await dispatch(
      swapQuotesApi.endpoints.fetchQuotes.initiate(
        {
          providers: ["lifi"],
          quotesInput: makeQuotesInput(),
          counterValueCurrency: "usd",
        },
        { forceRefetch: true },
      ),
    )) as { data?: unknown; error?: unknown };

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ rawQuotes: [rawQuote], providerErrors: [] });
  });
});
