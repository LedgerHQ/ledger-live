import { getEnv, setEnv } from "@ledgerhq/live-env";
import { getCryptoCurrencyById } from "./currencies";
import {
  getPreferredNewAccountScheme,
  getDefaultPreferredNewAccountScheme,
  getDerivationModesForCurrency,
  isInvalidDerivationMode,
  DerivationMode,
} from "./derivation";

describe("derivation.ts", () => {
  describe("getPreferredNewAccountScheme", () => {
    it("should return a list of schemes for a given currency", () => {
      const testData: [string, string[] | null][] = [
        ["bitcoin", ["native_segwit", "taproot", "segwit", ""]],
        ["ethereum", null],
        ["cosmos", null],
        ["litecoin", ["native_segwit", "segwit", ""]],
        ["qtum", ["segwit", ""]],
      ];
      testData.forEach(([currencyId, derivationModes]) => {
        if (!currencyId) return;
        const currency = getCryptoCurrencyById(currencyId);
        const p = getPreferredNewAccountScheme(currency);
        expect(p).toEqual(derivationModes);
      });
    });
  });

  describe("getDefaultPreferredNewAccountScheme", () => {
    it("should return a default scheme for a given currency", () => {
      const testData = [
        ["bitcoin", "native_segwit"],
        ["ethereum", null],
        ["cosmos", null],
        ["litecoin", "native_segwit"],
        ["qtum", "segwit"],
      ];
      testData.forEach(([currencyId, derivationMode]) => {
        if (!currencyId) return;
        const currency = getCryptoCurrencyById(currencyId);
        const defaultP = getDefaultPreferredNewAccountScheme(currency);
        expect(defaultP).toEqual(derivationMode);
      });
    });
  });

  describe("getDerivationModesForCurrency", () => {
    const expectations: [string, DerivationMode[]][] = [
      ["ethereum", ["ethM", "ethMM", ""]], // test for fixing missing legacy derivation
      ["ethereum_classic", ["ethM", "ethMM", "etcM", ""]], // test for fixing missing legacy derivation
      ["polygon", [""]], // test absence of impact on other EVMs
      ["bitcoin", ["native_segwit", "taproot", "segwit", ""]], // supportsSegwit + supportsNativeSegwit + taproot + segwit
      ["bitcoin_cash", ["unsplit", ""]], // forkedFrom
      ["bitcoin_gold", ["unsplit", "segwit_unsplit", "segwit", ""]], // forkedFrom + supportsSegwit
      ["tezos", ["galleonL", "tezboxL", "tezosbip44h", "tezbox"]], // disableBIP44
      ["solana", ["solanaMain", "solanaSub"]], // backward compatible change in getDerivationModesForCurrency
    ];

    let envBackup: boolean;
    beforeAll(() => {
      envBackup = getEnv("SCAN_FOR_INVALID_PATHS");
    });

    afterEach(() => {
      setEnv("SCAN_FOR_INVALID_PATHS", envBackup);
    });

    it.each(expectations)(
      "should return the expected derivation paths for %s with SCAN_FOR_INVALID_PATHS false",
      (currency, paths) => {
        setEnv("SCAN_FOR_INVALID_PATHS", false);
        expect(getDerivationModesForCurrency(getCryptoCurrencyById(currency))).toEqual(
          paths.filter(path => !isInvalidDerivationMode(path)),
        );
      },
    );

    it.each(expectations)(
      "should return the expected derivation paths for %s with SCAN_FOR_INVALID_PATHS true",
      (currency, paths) => {
        setEnv("SCAN_FOR_INVALID_PATHS", true);
        expect(getDerivationModesForCurrency(getCryptoCurrencyById(currency))).toEqual(paths);
      },
    );
  });
});
