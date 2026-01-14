import "../__tests__/test-helpers/setup";
import { isCryptoCurrency, getFamilyByCurrencyId } from "./helpers";
import { listCryptoCurrencies } from ".";

describe("Currencies helpers", () => {
  test("listCryptoCurrencies returns only crypto currencies", () => {
    const currencies = listCryptoCurrencies();

    currencies.forEach(currency => {
      expect(isCryptoCurrency(currency)).toBeTruthy();
    });
  });

  test("getFamilyByCurrencyId returns correct family for a known currency id", () => {
    expect(getFamilyByCurrencyId("bitcoin")).toBe("bitcoin");
    expect(getFamilyByCurrencyId("ethereum")).toBe("evm");
  });

  test("getFamilyByCurrencyId returns undefined for an unknown currency id", () => {
    expect(getFamilyByCurrencyId("unknown_currency_id")).toBeUndefined();
  });
});
