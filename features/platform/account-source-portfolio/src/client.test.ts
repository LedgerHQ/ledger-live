import { configureStore } from "@reduxjs/toolkit";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { portfolioApi, portfolioApiExtra } from "@shared/api-services";
import { PORTFOLIO_ID } from "./internals/fakeService.mock";
import { portfolioClientOf } from "./client";

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
});
