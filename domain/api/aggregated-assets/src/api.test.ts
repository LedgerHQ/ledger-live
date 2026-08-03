/*
 * The Domain Test CI job installs only ./domain/** and ./shared/**, so @shared/env's transitive
 * @ledgerhq/live-env (a libs/ package) is absent. Mock it with a factory so the real module is
 * never resolved — this test only reads a static property.
 */
jest.mock("@shared/env", () => ({
  getEnv: jest.fn().mockReturnValue("https://dada.api.ledger.com/v1"),
}));

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
