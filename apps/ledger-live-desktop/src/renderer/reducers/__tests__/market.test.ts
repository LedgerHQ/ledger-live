import marketReducer, { marketCategorySelector, type MarketState } from "../market";
import { importMarketState, setMarketCategory } from "../../actions/market";

const getInitialState = (): MarketState =>
  marketReducer(undefined, { type: "@@INIT" } as unknown as Parameters<typeof marketReducer>[1]);

describe("market reducer - category", () => {
  it("defaults the category to 'all'", () => {
    expect(getInitialState().category).toBe("all");
  });

  it("updates the category on MARKET_SET_CATEGORY", () => {
    const next = marketReducer(getInitialState(), setMarketCategory("stocks"));
    expect(next.category).toBe("stocks");
  });

  it("restores the category on MARKET_IMPORT_STATE", () => {
    const imported = { ...getInitialState(), category: "starred" as const };
    const next = marketReducer(getInitialState(), importMarketState(imported));
    expect(next.category).toBe("starred");
  });

  it("falls back to the current category when the imported state has none", () => {
    const current = marketReducer(getInitialState(), setMarketCategory("stocks"));
    const imported = {
      ...getInitialState(),
      category: undefined as unknown as MarketState["category"],
    };
    const next = marketReducer(current, importMarketState(imported));
    expect(next.category).toBe("stocks");
  });

  it("marketCategorySelector reads the persisted category", () => {
    const state = { market: { ...getInitialState(), category: "starred" as const } };
    expect(marketCategorySelector(state)).toBe("starred");
  });
});
