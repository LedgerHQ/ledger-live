import { configureStore } from "@reduxjs/toolkit";
import { portfolioApi, portfolioApiExtra } from "@shared/api-services";
import { accountPortfolioApi } from "./api";

const updateView = {
  network: "ethereum",
  account_id: "acc-1",
  time: "2025-01-01T00:00:00Z",
  tx: { hash: "0xt" },
  failed: false,
  fee: { asset: "ethereum", amount: "21" },
  events: {},
};

describe("accountPortfolioApi", () => {
  let fetchSpy: jest.SpyInstance;

  const makeStore = (url = "https://portfolio.test") =>
    configureStore({
      reducer: { [portfolioApi.reducerPath]: portfolioApi.reducer },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          thunk: { extraArgument: portfolioApiExtra({ portfolioServiceUrl: url }) },
        }).concat(portfolioApi.middleware),
    });

  const respond = (body: unknown) => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("puts the portfolio id in the path and returns the payload", async () => {
    respond({ items: [updateView], nextToken: null });

    const page = await makeStore()
      .dispatch(
        accountPortfolioApi.endpoints.getUpdates.initiate({
          portfolioId: "p1",
          account: "acc-1",
          currency: "eur",
        }),
      )
      .unwrap();

    const url = new URL((fetchSpy.mock.calls[0][0] as Request).url);
    expect(url.pathname).toBe("/v1/portfolio/p1/updates");
    expect(url.searchParams.get("account")).toBe("acc-1");
    expect(url.searchParams.has("portfolioId")).toBe(false);
    expect(page.items[0]).toEqual(expect.objectContaining({ events: {}, tx: { hash: "0xt" } }));
  });

  it("keeps the payload and the schema issues when a checked field drifts", async () => {
    const body = { items: [{ ...updateView, failed: "no" }] };
    respond(body);

    const result = await makeStore().dispatch(
      accountPortfolioApi.endpoints.getUpdates.initiate({ portfolioId: "p1" }),
    );

    expect(result.error).toMatchObject({
      status: "CUSTOM_ERROR",
      data: { httpStatus: 200, body, issues: expect.any(Array) },
    });
  });

  it("does not call the service when its url is empty", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch");

    const result = await makeStore("").dispatch(
      accountPortfolioApi.endpoints.getPortfolio.initiate({ portfolioId: "p1" }),
    );

    expect(result.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
