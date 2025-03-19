import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { DerivationMode } from "@ledgerhq/types-live";
import {
  asDerivationMode,
  getDefaultPreferredNewAccountScheme,
  getDerivationModesForCurrency,
  getPreferredNewAccountScheme,
  getSeedIdentifierDerivation,
  isInvalidDerivationMode,
} from "./derivation";

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

describe("getSeedIdentifierDerivation", () => {
  it.each([
    {
      currencyId: "neo",
      mode: "" as DerivationMode,
      expectedSeedPath: `44'/888'/0'/0/0`,
    },
    {
      currencyId: "filecoin",
      mode: asDerivationMode("filecoinBIP44"),
      expectedSeedPath: `44'/461'/0'/0/0`,
    },
    {
      currencyId: "stacks",
      mode: "" as DerivationMode,
      expectedSeedPath: `44'/5757'/0'/0/0`,
    },
    {
      currencyId: "solana",
      mode: asDerivationMode("solanaSub"),
      expectedSeedPath: `44'/501'`,
    },
    {
      currencyId: "solana",
      mode: asDerivationMode("solanaMain"),
      expectedSeedPath: `44'/501'`,
    },
    {
      currencyId: "hedera",
      mode: asDerivationMode("hederaBip44"),
      expectedSeedPath: `44/3030`,
    },
    {
      currencyId: "casper",
      mode: asDerivationMode("casper_wallet"),
      expectedSeedPath: `44'/506'/0'/0/0`,
    },
    {
      currencyId: "cardano",
      mode: asDerivationMode("cardano"),
      expectedSeedPath: `1852'/1815'/0'/0/0`,
    },
    {
      currencyId: "cardano_testnet",
      mode: asDerivationMode("cardano"),
      expectedSeedPath: `1852'/1815'/0'/0/0`,
    },
    {
      currencyId: "internet_computer",
      mode: asDerivationMode("internet_computer"),
      expectedSeedPath: `44'/223'/0'/0/0`,
    },
    {
      currencyId: "near",
      mode: "" as DerivationMode,
      expectedSeedPath: `44'/397'/0'/0'/0'`,
    },
    {
      currencyId: "vechain",
      mode: asDerivationMode("vechain"),
      expectedSeedPath: `44'/818'/0'/0/0`,
    },
    {
      currencyId: "ton",
      mode: asDerivationMode("ton"),
      expectedSeedPath: `44'/607'/0'/0'/0'/0'`,
    },
    {
      currencyId: "sui",
      mode: asDerivationMode("sui"),
      expectedSeedPath: `44'/784'/0'/0'/0'/0'`,
    },
    // Non dedicated seedIdentifierPath
    {
      currencyId: "algorand",
      mode: "" as DerivationMode,
      expectedSeedPath: `44'/283'/0'`,
    },
    {
      currencyId: "ripple",
      mode: "" as DerivationMode,
      expectedSeedPath: `44'/144'/0'`,
    },
  ])("$currencyId", ({ currencyId, mode, expectedSeedPath }) => {
    const fun = getSeedIdentifierDerivation(getCryptoCurrencyById(currencyId), mode);

    expect(fun).toEqual(expectedSeedPath);
  });
});
