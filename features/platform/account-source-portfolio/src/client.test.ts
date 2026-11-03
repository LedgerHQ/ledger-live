import { configureStore } from "@reduxjs/toolkit";
import { portfolioApi, portfolioApiExtra } from "@shared/api-services";
import { PORTFOLIO_ID } from "./internals/fakeService.mock";
import { portfolioClientOf } from "./client";

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
        thunk: {
          extraArgument: portfolioApiExtra({ portfolioServiceUrl: "https://portfolio.test" }),
        },
      }).concat(portfolioApi.middleware),
  });

describe("portfolioClientOf", () => {
  let fetchSpy: jest.SpyInstance | undefined;
  afterEach(() => {
    fetchSpy?.mockRestore();
    store?.dispatch(portfolioApi.util.resetApiState());
  });

  it("reads a non-JSON 404 as a portfolio the service does not know", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("Not Found", { status: 404 }));

    const client = portfolioClientOf(makeStore().dispatch);

    await expect(client.getPortfolio(PORTFOLIO_ID())).resolves.toBeUndefined();
  });

  it("aborts the listing when its signal does", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(
      (request: RequestInfo | URL) =>
        new Promise((_resolve, reject) => {
          if (request instanceof Request) {
            request.signal.addEventListener("abort", () => reject(new Error("aborted")));
          }
        }),
    );
    const listing = new AbortController();

    const read = portfolioClientOf(makeStore().dispatch).getPortfolio(
      PORTFOLIO_ID(),
      listing.signal,
    );
    listing.abort();

    await expect(read).rejects.toThrow("Portfolio service call failed");
  });
});
