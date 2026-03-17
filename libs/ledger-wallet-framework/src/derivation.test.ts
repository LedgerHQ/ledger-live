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
  it.each([
    {
      currencyId: "bitcoin",
      derivationModes: ["native_segwit", "taproot", "segwit", ""],
    },
    {
      currencyId: "ethereum",
      derivationModes: null,
    },
    {
      currencyId: "cosmos",
      derivationModes: null,
    },
    {
      currencyId: "litecoin",
      derivationModes: ["native_segwit", "segwit", ""],
    },
    {
      currencyId: "qtum",
      derivationModes: ["segwit", ""],
    },
  ])(
    "should return a list` of schemes for currency $currencyId",
    ({ currencyId, derivationModes }) => {
      const currency = getCryptoCurrencyById(currencyId);
      const p = getPreferredNewAccountScheme(currency);
      expect(p).toEqual(derivationModes);
    },
  );
});

describe("getDefaultPreferredNewAccountScheme", () => {
  it.each([
    {
      currencyId: "bitcoin",
      derivationMode: "native_segwit",
    },
    {
      currencyId: "ethereum",
      derivationMode: null,
    },
    {
      currencyId: "cosmos",
      derivationMode: null,
    },
    {
      currencyId: "litecoin",
      derivationMode: "native_segwit",
    },
    {
      currencyId: "qtum",
      derivationMode: "segwit",
    },
  ])(
    "should return a default scheme for currency $currencyId",
    ({ currencyId, derivationMode }) => {
      const currency = getCryptoCurrencyById(currencyId);
      const defaultP = getDefaultPreferredNewAccountScheme(currency);
      expect(defaultP).toEqual(derivationMode);
    },
  );
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
    ["solana", ["solanaMain", "solanaBip44Change", "solanaSub"]], // backward compatible change in getDerivationModesForCurrency
    ["celo", ["celo", "celoMM", "celoEvm"]], // backward compatible change in getDerivationModesForCurrency
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
      currencyId: "solana",
      mode: asDerivationMode("solanaBip44Change"),
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
    {
      currencyId: "celo",
      mode: "" as DerivationMode,
      expectedSeedPath: `44'/52752'/0'`,
    },
    {
      currencyId: "aleo",
      mode: asDerivationMode("aleo"),
      expectedSeedPath: `44'/683'/0`,
    },
    {
      currencyId: "aleo_testnet",
      mode: asDerivationMode("aleo"),
      expectedSeedPath: `44'/683'/0`,
    },
  ])("$currencyId", ({ currencyId, mode, expectedSeedPath }) => {
    const fun = getSeedIdentifierDerivation(getCryptoCurrencyById(currencyId), mode);

    expect(fun).toEqual(expectedSeedPath);
  });
});
