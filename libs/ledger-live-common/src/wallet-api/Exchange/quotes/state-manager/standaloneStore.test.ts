import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { makeQuotesInput } from "../fixtures/quotesInput";
import { getSwapQuotesDispatch } from "./store";
import { swapQuotesApi } from "./api";
import { setupStandaloneSwapQuotesStore } from "./standaloneStore";

jest.mock("../../../../exchange/swap", () => ({
  getSwapAPIBaseURL: jest.fn(() => "https://swap.test"),
}));

describe("setupStandaloneSwapQuotesStore", () => {
  const server = setupServer();

  beforeAll(() => server.listen());
  beforeEach(() => {
    // The dispatch lives on globalThis, which persists across test files in a
    // Jest worker. Reset it before each test so the "throws before setup"
    // assertion isn't order-dependent on any other suite that set it.
    globalThis.__ledgerSwapQuotesDispatch = undefined;
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => {
    server.close();
    // Clear the global dispatch registered during the tests so it doesn't leak
    // into other suites sharing the worker.
    globalThis.__ledgerSwapQuotesDispatch = undefined;
  });

  it("registers the store dispatch for getSwapQuotesDispatch", () => {
    expect(() => getSwapQuotesDispatch()).toThrow(/Swap quotes store is not set/);

    const store = setupStandaloneSwapQuotesStore();

    expect(getSwapQuotesDispatch()).toBe(store.dispatch);
  });

  it("wires a working store the fetchQuotes endpoint can run against", async () => {
    const rawQuote = { provider: "lifi", key: "lifi-key" };
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
