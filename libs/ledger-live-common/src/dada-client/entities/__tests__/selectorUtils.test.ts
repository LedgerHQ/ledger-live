import { createCurrencyDataSelector, type ApiState } from "../selectorUtils";

type Rate = { rate: number };

function stateWithQueries(queries: Record<string, unknown>): ApiState {
  return { assetsDataApi: { queries } } as ApiState;
}

function pagedQuery(...pages: Record<string, unknown>[]) {
  return { data: { pages } };
}

describe("createCurrencyDataSelector", () => {
  const selectRate = createCurrencyDataSelector<Rate>("interestRates");

  it("finds the entry matching the currency id under the requested data key", () => {
    const state = stateWithQueries({
      'getAssetsData({"product":"lld"})': pagedQuery({
        interestRates: { bitcoin: { rate: 4.2 } },
      }),
    });

    expect(selectRate(state, "bitcoin")).toEqual({ rate: 4.2 });
  });

  it("returns undefined for a currency id that is absent", () => {
    const state = stateWithQueries({
      a: pagedQuery({ interestRates: { bitcoin: { rate: 4.2 } } }),
    });

    expect(selectRate(state, "ethereum")).toBeUndefined();
  });

  it("only reads the requested data key and ignores the others", () => {
    const state = stateWithQueries({
      a: pagedQuery({ markets: { bitcoin: { price: 100 } } }),
    });

    expect(selectRate(state, "bitcoin")).toBeUndefined();
  });

  describe("tolerates missing levels of the cache shape", () => {
    it("returns undefined when the api slice is absent entirely", () => {
      expect(selectRate({}, "bitcoin")).toBeUndefined();
    });

    it("returns undefined when the api slice has no queries", () => {
      expect(selectRate({ assetsDataApi: {} }, "bitcoin")).toBeUndefined();
    });

    it("returns undefined when there are no cache entries", () => {
      expect(selectRate(stateWithQueries({}), "bitcoin")).toBeUndefined();
    });

    it("skips a cache entry that has no data", () => {
      const state = stateWithQueries({ pending: {} });

      expect(selectRate(state, "bitcoin")).toBeUndefined();
    });

    it("skips a cache entry whose data has no pages and keeps scanning the rest", () => {
      const state = stateWithQueries({
        // shape produced by the non-infinite getAssetData endpoint
        flat: { data: { interestRates: { bitcoin: { rate: 9.9 } } } },
        paged: pagedQuery({ interestRates: { bitcoin: { rate: 4.2 } } }),
      });

      expect(selectRate(state, "bitcoin")).toEqual({ rate: 4.2 });
    });

    it("skips a page that lacks the data key", () => {
      const state = stateWithQueries({
        a: pagedQuery({}, { interestRates: { bitcoin: { rate: 4.2 } } }),
      });

      expect(selectRate(state, "bitcoin")).toEqual({ rate: 4.2 });
    });
  });

  describe("scans every cache entry regardless of query args", () => {
    /*
     * Characterizes existing behavior, not a recommendation: the selector has no
     * access to the query args of the entries it walks, so a value cached by one
     * query is served to callers of any other. Preserve on migration.
     */
    it("returns a value cached by an unrelated query", () => {
      const state = stateWithQueries({
        'getAssetsData({"search":"something-else"})': pagedQuery({
          interestRates: { solana: { rate: 7.1 } },
        }),
      });

      expect(selectRate(state, "solana")).toEqual({ rate: 7.1 });
    });

    it("returns the first match in cache-entry order when several entries hold the same id", () => {
      const state = stateWithQueries({
        first: pagedQuery({ interestRates: { bitcoin: { rate: 1 } } }),
        second: pagedQuery({ interestRates: { bitcoin: { rate: 2 } } }),
      });

      expect(selectRate(state, "bitcoin")).toEqual({ rate: 1 });
    });

    it("returns the first match in page order within one entry", () => {
      const state = stateWithQueries({
        a: pagedQuery(
          { interestRates: { bitcoin: { rate: 1 } } },
          { interestRates: { bitcoin: { rate: 2 } } },
        ),
      });

      expect(selectRate(state, "bitcoin")).toEqual({ rate: 1 });
    });

    it("finds a match on a later page of a later entry", () => {
      const state = stateWithQueries({
        a: pagedQuery({ interestRates: {} }),
        b: pagedQuery({ interestRates: {} }, { interestRates: { cardano: { rate: 3.3 } } }),
      });

      expect(selectRate(state, "cardano")).toEqual({ rate: 3.3 });
    });
  });

  describe("falsy stored values", () => {
    it("treats a falsy stored value as absent", () => {
      const state = stateWithQueries({
        a: pagedQuery({ interestRates: { bitcoin: 0 } }),
        b: pagedQuery({ interestRates: { bitcoin: { rate: 4.2 } } }),
      });

      expect(selectRate(state, "bitcoin")).toEqual({ rate: 4.2 });
    });
  });

  describe("independent instances", () => {
    it("keeps separate data keys isolated from each other", () => {
      const selectMarket = createCurrencyDataSelector<{ price: number }>("markets");
      const state = stateWithQueries({
        a: pagedQuery({
          interestRates: { bitcoin: { rate: 4.2 } },
          markets: { bitcoin: { price: 100 } },
        }),
      });

      expect(selectRate(state, "bitcoin")).toEqual({ rate: 4.2 });
      expect(selectMarket(state, "bitcoin")).toEqual({ price: 100 });
    });

    it("returns correct values when called with alternating currency ids", () => {
      const state = stateWithQueries({
        a: pagedQuery({
          interestRates: { bitcoin: { rate: 4.2 }, ethereum: { rate: 3.1 } },
        }),
      });

      expect(selectRate(state, "bitcoin")).toEqual({ rate: 4.2 });
      expect(selectRate(state, "ethereum")).toEqual({ rate: 3.1 });
      expect(selectRate(state, "bitcoin")).toEqual({ rate: 4.2 });
    });
  });
});
