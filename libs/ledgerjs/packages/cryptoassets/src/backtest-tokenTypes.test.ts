import { listCryptoCurrencies } from "./currencies";
import { listTokenTypesForCryptoCurrency, listTokensForCryptoCurrency } from "./tokens";
import { initializeLegacyTokens } from "./legacy/legacy-data";
import { addTokens } from "./legacy/legacy-utils";

/*
 * Backward compatibility test for tokenTypes feature.
 * This test captures the current behavior of listTokenTypesForCryptoCurrency
 * before implementing the new tokenTypes field on Currency.
 * It ensures that the new implementation returns the same results.
 * When the legacy implementation is removed, this test will be removed.
 */
describe("backward compatibility for tokenTypes", () => {
  beforeAll(() => {
    initializeLegacyTokens(addTokens);
  });
  function oldListTokenTypesForCryptoCurrency(currency) {
    return listTokensForCryptoCurrency(currency).reduce<string[]>((acc, cur) => {
      const tokenType = cur.tokenType.replace("_", " ");
      if (acc.indexOf(tokenType) < 0) {
        return [...acc, tokenType];
      }
      return acc;
    }, []);
  }

  const allCurrencies = listCryptoCurrencies();

  allCurrencies.forEach(currency => {
    it(`currency ${currency.id}`, () => {
      const oldResult = oldListTokenTypesForCryptoCurrency(currency);
      const newResult = listTokenTypesForCryptoCurrency(currency);
      expect(newResult).toEqual(oldResult);
    });
  });
});
