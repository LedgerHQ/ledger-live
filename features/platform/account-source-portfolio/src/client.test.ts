import { configureStore } from "@reduxjs/toolkit";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { calApi, calApiExtra, portfolioApi, portfolioApiExtra } from "@shared/api-services";
import { PORTFOLIO_ID } from "./internals/fakeService.mock";
import { PortfolioServiceError, portfolioClientOf } from "./client";

const SERVICE_URL = "https://portfolio.test";
const PORTFOLIO_URL = `${SERVICE_URL}/v1/portfolio/portfolio`;

const server = setupServer();

let store: ReturnType<typeof createStore> | undefined;
const makeStore = () => {
  store = createStore();
  return store;
};
const createStore = () =>
  configureStore({
    reducer: { [portfolioApi.reducerPath]: portfolioApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: { extraArgument: portfolioApiExtra({ portfolioServiceUrl: SERVICE_URL }) },
      }).concat(portfolioApi.middleware),
  });

describe("portfolioClientOf", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    store?.dispatch(portfolioApi.util.resetApiState());
  });
  afterAll(() => server.close());

  it("reads a non-JSON 404 as a portfolio the service does not know", async () => {
    server.use(http.get(PORTFOLIO_URL, () => new HttpResponse("Not Found", { status: 404 })));

    const client = portfolioClientOf(makeStore().dispatch);

    await expect(client.getPortfolio(PORTFOLIO_ID())).resolves.toBeUndefined();
  });

  it("aborts the listing when its signal does", async () => {
    server.use(
      http.get(
        PORTFOLIO_URL,
        ({ request }) =>
          new Promise<Response>(resolve => {
            request.signal.addEventListener("abort", () => resolve(HttpResponse.error()));
          }),
      ),
    );
    const listing = new AbortController();

    const read = portfolioClientOf(makeStore().dispatch).getPortfolio(
      PORTFOLIO_ID(),
      listing.signal,
    );
    listing.abort();

    await expect(read).rejects.toThrow("Portfolio service call failed");
  });

  it("does not list with a signal already aborted", async () => {
    server.use(http.get(PORTFOLIO_URL, () => HttpResponse.json({ id: "p" })));

    const read = portfolioClientOf(makeStore().dispatch).getPortfolio(
      PORTFOLIO_ID(),
      AbortSignal.abort(),
    );

    await expect(read).rejects.toThrow("Portfolio service call failed");
  });

  describe("getUpdates", () => {
    const UPDATES_URL = `${PORTFOLIO_URL}/updates`;
    const params = { account: "ethereum:0xa", size: 5, token: "t1" };

    it("reads newest first, forwarding the account, the page size and the token", async () => {
      let url: URL | undefined;
      server.use(
        http.get(UPDATES_URL, ({ request }) => {
          url = new URL(request.url);
          return HttpResponse.json({ items: [], nextToken: null });
        }),
      );

      await portfolioClientOf(makeStore().dispatch).getUpdates(PORTFOLIO_ID(), params);

      expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
        order: "DESC",
        account: "ethereum:0xa",
        size: "5",
        token: "t1",
      });
    });

    it("cancels the request when its signal aborts", async () => {
      server.use(
        http.get(
          UPDATES_URL,
          ({ request }) =>
            new Promise<Response>(resolve => {
              request.signal.addEventListener("abort", () => resolve(HttpResponse.error()));
            }),
        ),
      );
      const reading = new AbortController();

      const read = portfolioClientOf(makeStore().dispatch).getUpdates(
        PORTFOLIO_ID(),
        params,
        reading.signal,
      );
      reading.abort();

      await expect(read).rejects.toThrow("Portfolio service call failed");
    });

    it("does not read with a signal already aborted", async () => {
      server.use(http.get(UPDATES_URL, () => HttpResponse.json({ items: [], nextToken: null })));

      const read = portfolioClientOf(makeStore().dispatch).getUpdates(
        PORTFOLIO_ID(),
        params,
        AbortSignal.abort(),
      );

      await expect(read).rejects.toThrow("Portfolio service call failed");
    });
  });

  describe("findToken", () => {
    const CAL_URL = "https://cal.test";
    const USDC = {
      id: "ethereum/erc20/usd_coin",
      contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
      standard: "erc20",
      decimals: 6,
      delisted: false,
      live_signature: "3045022100",
    };
    let calStore: ReturnType<typeof createCalStore> | undefined;
    /** Both service apis, as the apps register them. */
    const createCalStore = () =>
      configureStore({
        reducer: {
          [portfolioApi.reducerPath]: portfolioApi.reducer,
          [calApi.reducerPath]: calApi.reducer,
        },
        middleware: getDefaultMiddleware =>
          getDefaultMiddleware({
            thunk: {
              extraArgument: {
                ...portfolioApiExtra({ portfolioServiceUrl: SERVICE_URL }),
                ...calApiExtra({ calServiceUrl: CAL_URL, ledgerClientVersion: "1.0.0" }),
              },
            },
          }).concat(portfolioApi.middleware, calApi.middleware),
      });
    const clientOfCal = () => {
      calStore = createCalStore();
      return portfolioClientOf(calStore.dispatch);
    };
    const tokens = jest.fn();

    beforeEach(() => {
      tokens.mockReset();
      server.use(http.get(`${CAL_URL}/v1/tokens`, tokens));
    });
    afterEach(() => calStore?.dispatch(calApi.util.resetApiState()));

    it("reads the CAL token of an id", async () => {
      tokens.mockImplementation(() => HttpResponse.json([USDC]));

      const token = await clientOfCal().findToken(USDC.id);

      expect(token).toMatchObject({ id: USDC.id, parentCurrencyId: "ethereum" });
      expect(new URL(tokens.mock.calls[0][0].request.url).searchParams.get("id")).toBe(USDC.id);
    });

    it("reads no token when CAL does not list the id", async () => {
      tokens.mockImplementation(() => HttpResponse.json([]));

      await expect(clientOfCal().findToken("ethereum/erc20/unknown")).resolves.toBeUndefined();
    });

    it("serves a repeated lookup from the shared CAL cache", async () => {
      tokens.mockImplementation(() => HttpResponse.json([USDC]));
      const client = clientOfCal();

      await client.findToken(USDC.id);
      await client.findToken(USDC.id);

      expect(tokens).toHaveBeenCalledTimes(1);
    });

    it("fails with a service error that keeps the response body out", async () => {
      tokens.mockImplementation(() => HttpResponse.json({ unexpected: "0xdeadbeef" }));
      jest.spyOn(console, "error").mockImplementation(() => undefined);

      const lookup = clientOfCal().findToken(USDC.id);

      await expect(lookup).rejects.toBeInstanceOf(PortfolioServiceError);
      await expect(lookup).rejects.not.toThrow("0xdeadbeef");
    });
  });
});
