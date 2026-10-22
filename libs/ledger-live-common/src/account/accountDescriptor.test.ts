import { listCryptoCurrencies } from "@domain/entity-currency-crypto";
import { networkFromCurrencyId, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { DerivationMode } from "@ledgerhq/types-live";
import {
  MissingAccountXpubError,
  UnsupportedDescriptorPathError,
  fromLegacyAccount,
  toLegacyAccount,
  type LegacyAccountIdentity,
} from "./accountDescriptor";
import {
  derivationModeSupportsIndex,
  getDerivationModesForCurrency,
  getDerivationModeStartsAt,
  getDerivationScheme,
  runAccountDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import {
  getAccountDescriptorType,
  getRegisteredFamilies,
  isCoinModuleRegistered,
  registerCoinModules,
  resetCoinModulesForTests,
} from "../coin-modules/registry";
import { coinModuleLoaders } from "../coin-modules/loaders";
import { registerAllCoins } from "../coin-modules/load-all-coins";
import { CurrencyNotSupported } from "../errors";
import { resolveFamily } from "../bridge/zcashRouting";

const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";
const BTC_ADDR = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const ETH_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const descriptorTypeOf = (currencyId: string) =>
  getAccountDescriptorType(resolveFamily(getCryptoCurrencyById(currencyId)));

// a currency without a registered coin module cannot hold an account
const ACCOUNT_CURRENCY_IDS = listCryptoCurrencies(true)
  .filter(c => isCoinModuleRegistered(resolveFamily(c)))
  .map(c => c.id);

const account = (
  currencyId: string,
  derivationMode: DerivationMode,
  index: number,
  subject: { xpub: string } | { freshAddress: string },
): LegacyAccountIdentity => ({
  currency: { id: currencyId },
  derivationMode,
  index,
  xpub: undefined,
  freshAddress: "",
  ...subject,
});

describe("fromLegacyAccount", () => {
  it("builds a utxo descriptor with a hardened-only path", () => {
    expect(fromLegacyAccount(account("bitcoin", "native_segwit", 2, { xpub: XPUB }))).toEqual({
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "main" },
      xpub: XPUB,
      path: "m/84h/0h/2h",
    });
  });

  it("builds an address descriptor with the full path", () => {
    expect(fromLegacyAccount(account("ethereum", "", 1, { freshAddress: ETH_ADDR }))).toEqual({
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "ethereum", env: "main" },
      address: ETH_ADDR,
      path: "m/44h/60h/1h/0/0",
    });
  });

  it("maps a testnet currency to its network env", () => {
    const descriptor = fromLegacyAccount(
      account("bitcoin_testnet", "native_segwit", 0, { xpub: XPUB }),
    );
    expect(descriptor.network).toEqual({ name: "bitcoin", env: "testnet" });
  });
});

describe("fromLegacyAccount classification", () => {
  it("ignores the xpub field of an account-based currency", () => {
    const descriptor = fromLegacyAccount({
      ...account("ethereum", "", 0, { freshAddress: ETH_ADDR }),
      xpub: ETH_ADDR,
    });
    expect(descriptor).toMatchObject({ type: "address", address: ETH_ADDR });
  });

  const utxoCases: Array<[string, DerivationMode, string]> = [
    ["cardano", "cardano", "m/1852h/1815h/0h"],
    ["kaspa", "", "m/44h/111111h/0h"],
    ["zcash", "", "m/44h/133h/0h"],
  ];
  it.each(utxoCases)("builds a utxo descriptor for %s", (currencyId, mode, path) => {
    const descriptor = fromLegacyAccount({
      ...account(currencyId, mode, 0, { xpub: XPUB }),
      freshAddress: BTC_ADDR,
    });
    expect(descriptor).toMatchObject({ type: "utxo", xpub: XPUB, path });
  });

  it("is utxo exactly for the families identified by an extended public key", () => {
    const utxoFamilies = getRegisteredFamilies().filter(
      family => getAccountDescriptorType(family) === "utxo",
    );
    expect(utxoFamilies.sort()).toEqual(["bitcoin", "cardano", "kaspa", "zcash"]);
  });

  describe("without the coin module of the currency", () => {
    beforeEach(() => {
      resetCoinModulesForTests();
      registerCoinModules(coinModuleLoaders.filter(loader => loader.family !== "evm"));
    });
    afterEach(registerAllCoins);

    it("rejects the account", () => {
      expect(() =>
        fromLegacyAccount(account("ethereum", "", 0, { freshAddress: ETH_ADDR })),
      ).toThrow(CurrencyNotSupported);
    });
  });
});

describe("fromLegacyAccount without xpub", () => {
  it("rejects a utxo account, whose fresh address is not a stable identity", () => {
    expect(() =>
      fromLegacyAccount(account("bitcoin", "native_segwit", 0, { freshAddress: BTC_ADDR })),
    ).toThrow(MissingAccountXpubError);
  });
});

describe("fromLegacyAccount validation", () => {
  it("rejects an account without an address", () => {
    expect(() => fromLegacyAccount(account("ethereum", "", 0, { freshAddress: "" }))).toThrow(
      /address/,
    );
  });
});

const INDEXES = [0, 1, 2, 10, 2 ** 31 - 1];

// a scheme without <account> only has index 0
const supportsIndex = (mode: DerivationMode, scheme: string, index: number) =>
  index >= getDerivationModeStartsAt(mode) &&
  derivationModeSupportsIndex(mode, index) &&
  (index === 0 || scheme.includes("<account>"));

describe("round trip over every currency, derivation mode and index", () => {
  it.each(ACCOUNT_CURRENCY_IDS)("%s", currencyId => {
    const currency = getCryptoCurrencyById(currencyId);
    const subject =
      descriptorTypeOf(currencyId) === "utxo" ? { xpub: XPUB } : { freshAddress: ETH_ADDR };
    const mismatches: string[] = [];
    for (const mode of getDerivationModesForCurrency(currency)) {
      const scheme = getDerivationScheme({ derivationMode: mode, currency });
      for (const index of INDEXES) {
        if (!supportsIndex(mode, scheme, index)) continue;
        const back = toLegacyAccount(fromLegacyAccount(account(currencyId, mode, index, subject)));
        const expected = { currencyId, derivationMode: mode, index, ...subject };
        if (JSON.stringify(back) !== JSON.stringify(expected)) {
          mismatches.push(`${mode} index ${index} -> ${JSON.stringify(back)}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});

const toPath = (scheme: string) => `m/${scheme.replaceAll("'", "h")}`;

describe("descriptor -> legacy -> descriptor over generated descriptors", () => {
  it.each(ACCOUNT_CURRENCY_IDS)("%s", currencyId => {
    const currency = getCryptoCurrencyById(currencyId);
    const network = networkFromCurrencyId(currencyId);
    const isUtxo = descriptorTypeOf(currencyId) === "utxo";
    const problems: string[] = [];
    for (const mode of getDerivationModesForCurrency(currency)) {
      const scheme = getDerivationScheme({ derivationMode: mode, currency });
      for (const index of INDEXES) {
        if (!supportsIndex(mode, scheme, index)) continue;
        for (const [node, address] of [
          [0, 0],
          [1, 7],
        ]) {
          const pathOf = (opts: { node?: number; address?: number }) =>
            toPath(runDerivationScheme(scheme, currency, { account: index, ...opts }));
          const descriptor: AccountDescriptor = isUtxo
            ? {
                purpose: "account",
                version: "1",
                type: "utxo",
                network,
                xpub: XPUB,
                path: toPath(runAccountDerivationScheme(scheme, currency, { account: index })),
              }
            : {
                purpose: "account",
                version: "1",
                type: "address",
                network,
                address: ETH_ADDR,
                path: pathOf({ node, address }),
              };
          const legacy = toLegacyAccount(descriptor);
          const back = fromLegacyAccount({
            ...account(currencyId, legacy.derivationMode, legacy.index, { freshAddress: "" }),
            xpub: legacy.xpub,
            freshAddress: legacy.freshAddress ?? "",
          });
          // node and address are not restored, so an address descriptor comes back normalized
          const expected = isUtxo ? descriptor : { ...descriptor, path: pathOf({}) };
          const again = toLegacyAccount(back);
          if (legacy.derivationMode !== mode || legacy.index !== index) {
            problems.push(`${descriptor.path} -> ${legacy.derivationMode} ${legacy.index}`);
          } else if (JSON.stringify(back) !== JSON.stringify(expected)) {
            problems.push(`${descriptor.path} -> ${back.path}`);
          } else if (JSON.stringify(again) !== JSON.stringify(legacy)) {
            problems.push(`${descriptor.path} is not stable`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

// real accounts taken from the coin modules' bridge datasets
// `restoredMode`: celo accounts of the dataset use "" which shares the path of the "celo" mode
const REAL_ACCOUNTS: Array<LegacyAccountIdentity & { restoredMode?: DerivationMode }> = [
  {
    currency: { id: "bitcoin" },
    derivationMode: "",
    index: 0,
    freshAddress: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
    xpub: "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
  },
  {
    currency: { id: "bitcoin" },
    derivationMode: "native_segwit",
    index: 1,
    freshAddress: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
    xpub: "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2",
  },
  {
    currency: { id: "cardano_testnet" },
    derivationMode: "cardano",
    index: 0,
    freshAddress:
      "addr_test1qpj84xm4jlpcsvmrnldj86zz7g4mwzr7qg90wdjpn64uea44mcsd3mzvmr9qhfscxkyla3aqnzttwepay9mt3fz84smqyjvhh4",
    xpub: "806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d",
  },
  {
    currency: { id: "celo" },
    derivationMode: "",
    restoredMode: "celo",
    index: 0,
    freshAddress: "0xcfD48e0FAf9f19377509cE68a6A6F4D9C85ff8AB",
    xpub: undefined,
  },
  {
    currency: { id: "near" },
    derivationMode: "nearbip44h",
    index: 0,
    freshAddress: "18d68decb70d4d4fd267d19a0d25edc06ad079e69ded41233a10976cf36391ec",
    xpub: undefined,
  },
  {
    currency: { id: "ton" },
    derivationMode: "ton",
    index: 0,
    freshAddress: "UQCOvQLYvTcbi5tL9MaDNzuVl3-J3vATimNm9yO5XPafLfV4",
    xpub: undefined,
  },
];

describe("legacy -> descriptor -> legacy over real accounts", () => {
  it.each(REAL_ACCOUNTS)("$currency.id $derivationMode", real => {
    const back = toLegacyAccount(fromLegacyAccount(real));
    const identity =
      descriptorTypeOf(real.currency.id) === "utxo"
        ? { xpub: real.xpub }
        : { freshAddress: real.freshAddress };
    expect(back).toEqual({
      currencyId: real.currency.id,
      derivationMode: real.restoredMode ?? real.derivationMode,
      index: real.index,
      ...identity,
    });
  });
});

describe("toLegacyAccount", () => {
  it("does not match a mode whose first index is above the path's index", () => {
    const back = toLegacyAccount(
      fromLegacyAccount(account("tezos", "tezosbip44h", 0, { freshAddress: ETH_ADDR })),
    );
    expect(back).toMatchObject({ derivationMode: "tezosbip44h", index: 0 });
  });

  it("reads an uppercase hardened marker", () => {
    const back = toLegacyAccount({
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "ethereum", env: "main" },
      address: ETH_ADDR,
      path: "m/44H/60H/2H/0/0",
    });
    expect(back).toMatchObject({ derivationMode: "", index: 2 });
  });

  it("rejects an address descriptor of a utxo currency", () => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "1",
        type: "address",
        network: { name: "bitcoin", env: "main" },
        address: BTC_ADDR,
        path: "m/84h/0h/0h/0/0",
      }),
    ).toThrow(UnsupportedDescriptorPathError);
  });

  it("rejects a utxo descriptor of an address-based currency", () => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "1",
        type: "utxo",
        network: { name: "tezos", env: "main" },
        xpub: XPUB,
        path: "m/44h/1729h/0h",
      }),
    ).toThrow(UnsupportedDescriptorPathError);
  });

  it("rejects an address descriptor with an incomplete path", () => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "1",
        type: "address",
        network: { name: "ethereum", env: "main" },
        address: ETH_ADDR,
        path: "m/44h/60h/0h",
      }),
    ).toThrow(UnsupportedDescriptorPathError);
  });

  it.each([
    ["an unknown purpose", "m/12h/0h/0h"],
    ["a wrong coin type", "m/84h/1h/0h"],
  ])("rejects a utxo path with %s", (_, path) => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "1",
        type: "utxo",
        network: { name: "bitcoin", env: "main" },
        xpub: XPUB,
        path,
      }),
    ).toThrow(UnsupportedDescriptorPathError);
  });

  it.each([
    ["a non-hardened account", "m/84h/0h/0"],
    ["too many segments", "m/84h/0h/0h/0/0/0"],
  ])("rejects a utxo path with %s as an invalid descriptor", (_, path) => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "1",
        type: "utxo",
        network: { name: "bitcoin", env: "main" },
        xpub: XPUB,
        path,
      }),
    ).toThrow("hardened segments");
  });
});
