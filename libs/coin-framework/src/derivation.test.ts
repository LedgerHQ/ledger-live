import { getCryptoCurrencyById } from "./currencies";
import {
  getPreferredNewAccountScheme,
  getDefaultPreferredNewAccountScheme,
} from "./derivation";
describe("derivation", () => {
  test("getPreferredNewAccountScheme should return a list of schemes for a given currency", () => {
    const testData = [
      ["bitcoin", ["native_segwit", "taproot", "segwit", ""]],
      ["ethereum", null],
      ["cosmos", null],
      ["litecoin", ["native_segwit", "segwit", ""]],
      ["qtum", ["segwit", ""]],
    ];
    testData.forEach(([currencyId, derivationModes]) => {
      const currency = getCryptoCurrencyById(<string>currencyId);
      const p = getPreferredNewAccountScheme(currency);
      expect(p).toEqual(derivationModes);
    });
  });
  test("getDefaultPreferredNewAccountScheme should return a default scheme for a given currency", () => {
    const testData = [
      ["bitcoin", "native_segwit"],
      ["ethereum", null],
      ["cosmos", null],
      ["litecoin", "native_segwit"],
      ["qtum", "segwit"],
    ];
    testData.forEach(([currencyId, derivationMode]) => {
      const currency = getCryptoCurrencyById(<string>currencyId);
      const defaultP = getDefaultPreferredNewAccountScheme(currency);
      expect(defaultP).toEqual(derivationMode);
    });
  });
});
