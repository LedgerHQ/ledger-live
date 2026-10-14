import { currencyFormatter } from "../currencyFormatter";
import { createMockMarketItemResponse } from "../fixtures";
import {
  buildMarketListParams,
  getNextMarketListPage,
  toMarketListQueryArg,
} from "../marketListQueryArg";
import { Order } from "../types";

function rows(count: number) {
  return currencyFormatter(
    Array.from({ length: count }, (_, index) =>
      createMockMarketItemResponse({ id: `coin-${index}`, name: `Coin ${index}` }),
    ),
  );
}

function request(params: Parameters<typeof toMarketListQueryArg>[0]) {
  return buildMarketListParams({ queryArg: toMarketListQueryArg(params), page: 0 });
}

describe("market list query arg", () => {
  it("should use a legal limit as the page size", () => {
    expect(request({ counterCurrency: "usd", limit: 20 })).toMatchObject({
      page: 0,
      pageSize: 20,
      to: "usd",
      sort: "market-cap-rank",
      limit: undefined,
    });
  });

  it("should paginate a top 100 cap with page size 50", () => {
    expect(request({ counterCurrency: "usd", limit: 100 })).toMatchObject({
      pageSize: 50,
      limit: 100,
    });
  });

  it("should omit a one-character search", () => {
    expect(request({ counterCurrency: "usd", search: "b" }).filter).toBeUndefined();
  });

  it("should send a lowercased filter once the search reaches two characters", () => {
    expect(request({ counterCurrency: "usd", search: "BT" }).filter).toBe("bt");
  });

  it("should send an explicit filter independently from the search length", () => {
    expect(request({ counterCurrency: "usd", search: "b", filter: "stock" }).filter).toBe("stock");
  });

  it("should sort starred ids", () => {
    expect(request({ counterCurrency: "usd", starred: ["ethereum", "bitcoin"] }).ids).toBe(
      "bitcoin,ethereum",
    );
  });

  it("should put the range in the sort for top gainers", () => {
    const built = request({
      counterCurrency: "usd",
      order: Order.topGainers,
      range: "7d",
      categories: "privacy",
    });

    expect(built.sort).toBe("positive-price-change-1w");
    expect(built.categories).toBe("privacy");
    expect(built).not.toHaveProperty("top");
  });

  it("should request the next page while the last page is full", () => {
    const queryArg = toMarketListQueryArg({ counterCurrency: "usd", limit: 5 });
    const firstPage = rows(5);

    expect(getNextMarketListPage(firstPage, [firstPage], 0, queryArg)).toBe(1);
  });

  it("should stop when the last page is short", () => {
    const queryArg = toMarketListQueryArg({ counterCurrency: "usd", limit: 5 });

    expect(getNextMarketListPage(rows(1), [rows(5), rows(1)], 1, queryArg)).toBeUndefined();
  });

  it("should stop once the loaded rows reach the result cap", () => {
    const queryArg = toMarketListQueryArg({ counterCurrency: "usd", limit: 100 });
    const firstPage = rows(50);
    const secondPage = rows(50);

    expect(getNextMarketListPage(secondPage, [firstPage, secondPage], 1, queryArg)).toBeUndefined();
  });
});
