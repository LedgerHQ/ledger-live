import { selectInterestRateByCurrency } from "../interestRateSelectors";
import type { ApiState } from "../selectorUtils";
import type { InterestRate } from "..";

const bitcoinRate: InterestRate = {
  currencyId: "bitcoin",
  rate: 4.2,
  type: "APY",
  fetchAt: "2026-07-31T00:00:00.000Z",
};

function stateWith(pages: Record<string, unknown>[]): ApiState {
  return { assetsDataApi: { queries: { a: { data: { pages } } } } } as ApiState;
}

describe("selectInterestRateByCurrency", () => {
  it("reads from the interestRates collection", () => {
    const state = stateWith([{ interestRates: { bitcoin: bitcoinRate } }]);

    expect(selectInterestRateByCurrency(state, "bitcoin")).toEqual(bitcoinRate);
  });

  it("returns undefined when the currency has no rate", () => {
    const state = stateWith([{ interestRates: { bitcoin: bitcoinRate } }]);

    expect(selectInterestRateByCurrency(state, "ethereum")).toBeUndefined();
  });

  it("does not read from the markets collection", () => {
    const state = stateWith([{ markets: { bitcoin: { price: 100 } } }]);

    expect(selectInterestRateByCurrency(state, "bitcoin")).toBeUndefined();
  });

  it("returns undefined for an empty state", () => {
    expect(selectInterestRateByCurrency({}, "bitcoin")).toBeUndefined();
  });

  it("preserves every field of the stored rate", () => {
    const state = stateWith([{ interestRates: { bitcoin: bitcoinRate } }]);

    expect(selectInterestRateByCurrency(state, "bitcoin")).toEqual(
      expect.objectContaining({ currencyId: "bitcoin", rate: 4.2, type: "APY" }),
    );
  });
});
