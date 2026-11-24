import {
  Order,
  type MarketCurrency,
  type MarketListQueryArg,
} from "@domain/entity-market-currency";
import { buildMarketListParams, getNextMarketListPage } from "./marketList";
import { formatMarketCurrency } from "./transforms";
import { mockMarketItemResponse } from "./marketItem.mock";

const queryArg = (overrides: Partial<MarketListQueryArg> = {}): MarketListQueryArg => ({
  counterCurrency: "usd",
  pageSize: 20,
  ...overrides,
});

describe("buildMarketListParams", () => {
  it("defaults to the market cap order over the 24 hour range", () => {
    expect(buildMarketListParams({ queryArg: queryArg(), page: 2 })).toEqual(
      expect.objectContaining({
        page: 2,
        pageSize: 20,
        to: "usd",
        sort: "market-cap-rank",
      }),
    );
  });

  it("uses the search as the filter when no filter is given", () => {
    const params = buildMarketListParams({
      queryArg: queryArg({ search: "btc" }),
      page: 0,
    });

    expect(params.filter).toBe("btc");
  });

  it("builds the price-change sort over the requested range", () => {
    const params = buildMarketListParams({
      queryArg: queryArg({ order: Order.topLosers, range: "1y" }),
      page: 0,
    });

    expect(params.sort).toBe("negative-price-change-1y");
  });
});

const page = (count: number): MarketCurrency[] =>
  Array.from({ length: count }, (_, index) =>
    formatMarketCurrency(mockMarketItemResponse({ id: `coin-${index}` })),
  );

describe("getNextMarketListPage", () => {
  it("stops when the last page is not full", () => {
    expect(getNextMarketListPage(page(3), [page(20), page(3)], 1, queryArg())).toBeUndefined();
  });

  it("stops once the loaded count reaches the limit", () => {
    expect(
      getNextMarketListPage(page(20), [page(20), page(20)], 1, queryArg({ limit: 40 })),
    ).toBeUndefined();
  });

  it("asks for the page after the last one while more are expected", () => {
    expect(getNextMarketListPage(page(20), [page(20)], 0, queryArg({ limit: 100 }))).toBe(1);
  });
});
