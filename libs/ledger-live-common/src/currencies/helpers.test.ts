import "../__tests__/test-helpers/setup";
import { isCryptoCurrency } from "./helpers";
import { listCryptoCurrencies } from ".";

describe("Currencies helpers", () => {
  test("listCryptoCurrencies returns only crypto currencies", () => {
    const currencies = listCryptoCurrencies();

    currencies.forEach(currency => {
      expect(isCryptoCurrency(currency)).toBeTruthy();
    });
  });
});
