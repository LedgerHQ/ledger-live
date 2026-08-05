import { selectMarketByCurrency } from "../marketSelectors";
import type { ApiState } from "../selectorUtils";

const bitcoinMarket = {
  price: 65000.42,
  priceChangePercentage24h: 1.2345,
  marketCap: 1_280_000_000_000,
};

function stateWith(pages: Record<string, unknown>[]): ApiState {
  return { assetsDataApi: { queries: { a: { data: { pages } } } } } as ApiState;
}

describe("selectMarketByCurrency", () => {
  it("reads from the markets collection", () => {
    const state = stateWith([{ markets: { bitcoin: bitcoinMarket } }]);

    expect(selectMarketByCurrency(state, "bitcoin")).toEqual(bitcoinMarket);
  });

  it("returns undefined when the currency has no market entry", () => {
    const state = stateWith([{ markets: { bitcoin: bitcoinMarket } }]);

    expect(selectMarketByCurrency(state, "ethereum")).toBeUndefined();
  });

  it("does not read from the interestRates collection", () => {
    const state = stateWith([{ interestRates: { bitcoin: { rate: 4.2 } } }]);

    expect(selectMarketByCurrency(state, "bitcoin")).toBeUndefined();
  });

  it("returns undefined for an empty state", () => {
    expect(selectMarketByCurrency({}, "bitcoin")).toBeUndefined();
  });

  it("returns partial market entries unchanged, without filling defaults", () => {
    const state = stateWith([{ markets: { bitcoin: { price: 65000 } } }]);

    expect(selectMarketByCurrency(state, "bitcoin")).toEqual({ price: 65000 });
  });
});
