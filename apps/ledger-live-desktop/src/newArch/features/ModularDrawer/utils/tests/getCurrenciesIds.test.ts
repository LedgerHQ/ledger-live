import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrenciesIds } from "../getCurrenciesIds";
import { res as GroupedCurrencies } from "../../__mocks__/useGroupedCurrenciesByProvider.mock";

const MOCK_CURRENCY_BY_PROVIDER_ID = GroupedCurrencies.result.currenciesByProvider;

const allIdsFromMock = ["ethereum", "arbitrum", "base", "scroll"];

describe("getCurrencyIds", () => {
  it("should return an array of currency IDs", () => {
    const currencies = MOCK_CURRENCY_BY_PROVIDER_ID;
    const result = getCurrenciesIds(currencies[1].currenciesByNetwork as CryptoOrTokenCurrency[]);
    expect(result).toEqual(allIdsFromMock);
  });
  it("should return an empty array when no currencies are provided", () => {
    const currencies: CryptoOrTokenCurrency[] = [];
    const result = getCurrenciesIds(currencies);
    expect(result).toEqual([]);
  });
  it("should handle currencies with duplicate IDs", () => {
    const currencies = [
      { id: "1", name: "Currency 1" } as CryptoOrTokenCurrency,
      { id: "1", name: "Currency 2" } as CryptoOrTokenCurrency,
    ];
    const result = getCurrenciesIds(currencies);
    expect(result).toEqual(["1", "1"]);
  });
  it("should return IDs as strings", () => {
    const currencies = [
      { id: "1", name: "Currency 1" } as CryptoOrTokenCurrency,
      { id: "2", name: "Currency 2" } as CryptoOrTokenCurrency,
    ];
    const result = getCurrenciesIds(currencies);
    expect(result).toEqual(["1", "2"]);
  });
  it("should return IDs in the same order as the input array", () => {
    const currencies = [
      { id: "a", name: "Currency A" } as CryptoOrTokenCurrency,
      { id: "b", name: "Currency B" } as CryptoOrTokenCurrency,
      { id: "c", name: "Currency C" } as CryptoOrTokenCurrency,
    ];
    const result = getCurrenciesIds(currencies);
    expect(result).toEqual(["a", "b", "c"]);
  });
});
