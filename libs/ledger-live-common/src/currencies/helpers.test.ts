import "../__tests__/test-helpers/setup";
import { isPlatformSupportedCurrency } from "../platform/helpers";
import { isCryptoCurrency, listCurrencies } from "./helpers";

describe("Currencies helpers", () => {
  test("listCurrencies without includeTokens", () => {
    const currencies = listCurrencies(false);

    currencies.forEach((currency) => {
      expect(isCryptoCurrency(currency)).toBeTruthy();
    });
  });

  test("listCurrencies with includeTokens", () => {
    const currencies = listCurrencies(true);

    currencies.forEach((currency) => {
      expect(isPlatformSupportedCurrency(currency)).toBeTruthy();
    });
  });
});
