import { assetsDataApi } from "./api";

describe("assetsDataApi", () => {
  /*
   * createCurrencyDataSelector hand-scans state.assetsDataApi.queries by string, and Storybook
   * stories preload this exact key. A rename produces no type error and silently returns
   * undefined for every market and interest-rate lookup, so pin the literal.
   */
  it("keeps the frozen reducerPath", () => {
    expect(assetsDataApi.reducerPath).toBe("assetsDataApi");
  });
});
