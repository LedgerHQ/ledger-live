import { listCryptoCurrencies } from "@domain/entity-currency-crypto";
import {
  NetworkIdSchema,
  computeAccountUUID,
  networkFromCurrencyId,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { DerivationMode } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import {
  InvalidAccountKeyError,
  MissingAccountPublicKeyError,
  UnsupportedAddressFromKeyError,
  addressFromKey,
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

const familyOf = (currencyId: string) => resolveFamily(getCryptoCurrencyById(currencyId));
const descriptorTypeOf = (currencyId: string) => getAccountDescriptorType(familyOf(currencyId));

type RealPublicKey = {
  currencyId: string;
  derivationMode: DerivationMode;
  publicKey: string;
  address: string;
};

/** A real public key and the address it gives, per family identified by its public key. */
const PUBLIC_KEYS: Record<string, RealPublicKey> = {
  aptos: {
    currencyId: "aptos",
    derivationMode: "aptos",
    publicKey: "d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956",
    address: "0x445fa0013887abd1a0c14acdec6e48090e0ad3fed3e08202aac15ca14f3be26b",
  },
  canton: {
    currencyId: "canton_network",
    derivationMode: "canton",
    publicKey: "c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c51097",
    address: "canton_402f2e68",
  },
  // its address is looked up on chain, not computed from its key
  concordium: {
    currencyId: "concordium",
    derivationMode: "concordium",
    publicKey: "86196cb40cd25e9e696bc808e3f2c074ce0b39f2a2a9d482a68eafef86e4a060",
    address: "86196cb40cd25e9e696bc808e3f2c074ce0b39f2a2a9d482a68eafef86e4a060",
  },
  internet_computer: {
    currencyId: "internet_computer",
    derivationMode: "internet_computer",
    publicKey:
      "046f08828871028b6e3cb5c13b2e2a8fa6e93f0b3ca7379171f6b7b45877955a2430925f76ec69ccb3cd8738859a8e29dcd0f9a357f1d009d2b497c6c8f63aa7cf",
    address: "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37",
  },
  stacks: {
    currencyId: "stacks",
    derivationMode: "",
    publicKey: "022a460decc9dba8c452927fecb33d7ae25a8d79dc5442b84feaf8f3aa0e2b575d",
    address: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
  },
  ton: {
    currencyId: "ton",
    derivationMode: "ton",
    publicKey: "86196cb40cd25e9e696bc808e3f2c074ce0b39f2a2a9d482a68eafef86e4a060",
    address: "UQCOvQLYvTcbi5tL9MaDNzuVl3-J3vATimNm9yO5XPafLfV4",
  },
};

// a currency without a registered coin module cannot hold an account
const ACCOUNT_CURRENCY_IDS = listCryptoCurrencies(true)
  .filter(c => isCoinModuleRegistered(resolveFamily(c)))
  .map(c => c.id);

type Subject = { xpub: string } | { freshAddress: string } | { publicKey: string };

/** A legacy account whose id holds its public key, its xpub or its address, as the coin modules encode it. */
const account = (
  currencyId: string,
  derivationMode: DerivationMode,
  index: number,
  subject: Subject,
): LegacyAccountIdentity => {
  const xpub = "xpub" in subject ? subject.xpub : undefined;
  const freshAddress = "freshAddress" in subject ? subject.freshAddress : "";
  const publicKey = "publicKey" in subject ? subject.publicKey : undefined;
  return {
    id: encodeAccountId({
      type: "js",
      version: "2",
      currencyId,
      xpubOrAddress: publicKey ?? xpub ?? freshAddress,
      derivationMode,
    }),
    currency: { id: currencyId },
    derivationMode,
    index,
    xpub,
    freshAddress,
    ...(publicKey && { cantonResources: { publicKey } }),
  };
};

/** What an account of the currency is identified by, and what `toLegacyAccount` gives back of it. */
function subjectOf(currencyId: string): { subject: Subject; back: Record<string, string> } {
  const family = familyOf(currencyId);
  if (family in PUBLIC_KEYS) {
    const { publicKey } = PUBLIC_KEYS[family];
    return { subject: { publicKey }, back: { publicKey } };
  }
  return descriptorTypeOf(currencyId) === "utxo"
    ? { subject: { xpub: XPUB }, back: { xpub: XPUB } }
    : { subject: { freshAddress: ETH_ADDR }, back: { freshAddress: ETH_ADDR } };
}

describe("fromLegacyAccount", () => {
  it("builds a utxo descriptor with a hardened-only path", () => {
    expect(fromLegacyAccount(account("bitcoin", "native_segwit", 2, { xpub: XPUB }))).toEqual({
      purpose: "account",
      version: "2",
      type: "utxo",
      network: "bitcoin",
      key: XPUB,
      path: "m/84h/0h/2h",
    });
  });

  it("builds an address descriptor with the full path", () => {
    expect(fromLegacyAccount(account("ethereum", "", 1, { freshAddress: ETH_ADDR }))).toEqual({
      purpose: "account",
      version: "2",
      type: "address",
      network: "ethereum",
      key: ETH_ADDR,
      path: "m/44h/60h/1h/0/0",
    });
  });

  it("maps a testnet currency to its CAL network id", () => {
    const descriptor = fromLegacyAccount(
      account("bitcoin_testnet", "native_segwit", 0, { xpub: XPUB }),
    );
    expect(descriptor.network).toBe("bitcoin_testnet");
  });
});

describe("fromLegacyAccount classification", () => {
  it("ignores the xpub field of an account-based currency", () => {
    const descriptor = fromLegacyAccount({
      ...account("ethereum", "", 0, { freshAddress: ETH_ADDR }),
      xpub: ETH_ADDR,
    });
    expect(descriptor).toMatchObject({ type: "address", key: ETH_ADDR });
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
    expect(descriptor).toMatchObject({ type: "utxo", key: XPUB, path });
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
      /key/,
    );
  });

  it("rejects an empty currency id as an unknown currency", () => {
    expect(() => fromLegacyAccount(account("", "", 0, { freshAddress: ETH_ADDR }))).toThrow(
      new Error('currency with id "" not found'),
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
    const { subject, back: identity } = subjectOf(currencyId);
    const mismatches: string[] = [];
    for (const mode of getDerivationModesForCurrency(currency)) {
      const scheme = getDerivationScheme({ derivationMode: mode, currency });
      for (const index of INDEXES) {
        if (!supportsIndex(mode, scheme, index)) continue;
        const back = toLegacyAccount(fromLegacyAccount(account(currencyId, mode, index, subject)));
        const expected = { currencyId, derivationMode: mode, index, ...identity };
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
    const { subject } = subjectOf(currencyId);
    const key = "publicKey" in subject ? subject.publicKey : ETH_ADDR;
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
                version: "2",
                type: "utxo",
                network,
                key: XPUB,
                path: toPath(runAccountDerivationScheme(scheme, currency, { account: index })),
              }
            : {
                purpose: "account",
                version: "2",
                type: "address",
                network,
                key,
                path: pathOf({ node, address }),
              };
          const legacy = toLegacyAccount(descriptor);
          const back = fromLegacyAccount({
            ...account(
              currencyId,
              legacy.derivationMode,
              legacy.index,
              legacy.publicKey ? { publicKey: legacy.publicKey } : { freshAddress: "" },
            ),
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

type RealAccount = {
  currencyId: string;
  derivationMode: DerivationMode;
  /** celo accounts of the dataset use "" which shares the path of the "celo" mode */
  restoredMode?: DerivationMode;
  index: number;
  freshAddress: string;
  xpub?: string;
  publicKey?: string;
};

// real accounts taken from the coin modules' bridge datasets
const REAL_ACCOUNTS: RealAccount[] = [
  {
    currencyId: "bitcoin",
    derivationMode: "",
    index: 0,
    freshAddress: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
    xpub: "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
  },
  {
    currencyId: "bitcoin",
    derivationMode: "native_segwit",
    index: 1,
    freshAddress: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
    xpub: "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2",
  },
  {
    currencyId: "cardano_testnet",
    derivationMode: "cardano",
    index: 0,
    freshAddress:
      "addr_test1qpj84xm4jlpcsvmrnldj86zz7g4mwzr7qg90wdjpn64uea44mcsd3mzvmr9qhfscxkyla3aqnzttwepay9mt3fz84smqyjvhh4",
    xpub: "806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d",
  },
  {
    currencyId: "celo",
    derivationMode: "",
    restoredMode: "celo",
    index: 0,
    freshAddress: "0xcfD48e0FAf9f19377509cE68a6A6F4D9C85ff8AB",
  },
  {
    currencyId: "near",
    derivationMode: "nearbip44h",
    index: 0,
    freshAddress: "18d68decb70d4d4fd267d19a0d25edc06ad079e69ded41233a10976cf36391ec",
  },
  {
    currencyId: "hedera",
    derivationMode: "hederaBip44",
    index: 0,
    freshAddress: "0.0.751515",
  },
  ...Object.values(PUBLIC_KEYS).map(({ currencyId, derivationMode, publicKey, address }) => ({
    currencyId,
    derivationMode,
    index: 0,
    freshAddress: address,
    publicKey,
  })),
];

describe("legacy -> descriptor -> legacy over real accounts", () => {
  it.each(REAL_ACCOUNTS)("$currencyId $derivationMode", async real => {
    const { currencyId, derivationMode, index, freshAddress, xpub, publicKey } = real;
    const legacy = account(
      currencyId,
      derivationMode,
      index,
      publicKey ? { publicKey } : { freshAddress },
    );
    const back = toLegacyAccount(fromLegacyAccount({ ...legacy, freshAddress, xpub }));
    const identity =
      descriptorTypeOf(currencyId) === "utxo"
        ? { xpub }
        : publicKey
          ? { publicKey }
          : { freshAddress };
    expect(back).toEqual({
      currencyId,
      derivationMode: real.restoredMode ?? derivationMode,
      index,
      ...identity,
    });
    const address = addressFromKey(currencyId, publicKey ?? freshAddress);
    if (familyOf(currencyId) === "canton" || familyOf(currencyId) === "concordium") {
      await expect(address).rejects.toThrow(UnsupportedAddressFromKeyError);
    } else {
      expect(await address).toBe(freshAddress);
    }
  });
});

describe("fromLegacyAccount of a family identified by its public key", () => {
  it("keys the account on the public key, not on its address", () => {
    const { publicKey, address } = PUBLIC_KEYS.ton;
    const descriptor = fromLegacyAccount({
      ...account("ton", "ton", 0, { publicKey }),
      freshAddress: address,
    });
    expect(descriptor).toMatchObject({ type: "address", key: publicKey });
  });

  it("writes the public key in lowercase", () => {
    const { publicKey } = PUBLIC_KEYS.aptos;
    const descriptor = fromLegacyAccount(
      account("aptos", "aptos", 0, { publicKey: publicKey.toUpperCase() }),
    );
    expect(descriptor.key).toBe(publicKey);
  });

  it("gives two Canton keys sharing an address two descriptors", () => {
    // their 31-bit hash, the device's canton_ address, is the same
    const keys = [
      "07ddfacf552dda79077a36be121e9bb2846944e91d034dc00c5cf926d0bc49ad",
      "fff5cc0c24ccb9ea197cd7515c636d7b39cabf37a6b3d1fe903282511e0237e1",
    ];
    const [a, b] = keys.map(publicKey =>
      fromLegacyAccount(account("canton_network", "canton", 0, { publicKey })),
    );
    expect(computeAccountUUID(a)).not.toBe(computeAccountUUID(b));
  });

  it("falls back to the public key kept in xpub when the id holds the address (Aptos)", () => {
    const { publicKey, address } = PUBLIC_KEYS.aptos;
    const descriptor = fromLegacyAccount({
      ...account("aptos", "aptos", 0, { freshAddress: address }),
      xpub: publicKey,
    });
    expect(descriptor.key).toBe(publicKey);
  });

  it.each([
    [
      "a Canton account synced before its key was captured",
      account("canton_network", "canton", 0, { freshAddress: "canton_402f2e68" }),
    ],
    [
      "an Aptos id holding its address",
      account("aptos", "aptos", 0, { freshAddress: PUBLIC_KEYS.aptos.address }),
    ],
    [
      "a Stacks id holding its address",
      account("stacks", "", 0, { freshAddress: PUBLIC_KEYS.stacks.address }),
    ],
  ])("rejects %s", (_, legacy) => {
    expect(() => fromLegacyAccount(legacy)).toThrow(MissingAccountPublicKeyError);
  });
});

describe("a descriptor of a public-key family keyed on its address", () => {
  // written before these families were keyed on their public key
  const { address } = PUBLIC_KEYS.ton;
  const descriptor: AccountDescriptor = {
    purpose: "account",
    version: "2",
    type: "address",
    network: NetworkIdSchema.parse("ton"),
    key: address,
    path: "m/44h/607h/0h/0h/0h/0h",
  };

  it("is rejected, not read as a public key", async () => {
    expect(() => toLegacyAccount(descriptor)).toThrow(InvalidAccountKeyError);
    await expect(addressFromKey("ton", address)).rejects.toThrow(InvalidAccountKeyError);
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
      version: "2",
      type: "address",
      network: NetworkIdSchema.parse("ethereum"),
      key: ETH_ADDR,
      path: "m/44H/60H/2H/0/0",
    });
    expect(back).toMatchObject({ derivationMode: "", index: 2 });
  });

  it("rejects an address descriptor of a utxo currency", () => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "2",
        type: "address",
        network: NetworkIdSchema.parse("bitcoin"),
        key: BTC_ADDR,
        path: "m/84h/0h/0h/0/0",
      }),
    ).toThrow(UnsupportedDescriptorPathError);
  });

  it("rejects a utxo descriptor of an address-based currency", () => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "2",
        type: "utxo",
        network: NetworkIdSchema.parse("tezos"),
        key: XPUB,
        path: "m/44h/1729h/0h",
      }),
    ).toThrow(UnsupportedDescriptorPathError);
  });

  it("rejects an address descriptor with an incomplete path", () => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "2",
        type: "address",
        network: NetworkIdSchema.parse("ethereum"),
        key: ETH_ADDR,
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
        version: "2",
        type: "utxo",
        network: NetworkIdSchema.parse("bitcoin"),
        key: XPUB,
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
        version: "2",
        type: "utxo",
        network: NetworkIdSchema.parse("bitcoin"),
        key: XPUB,
        path,
      }),
    ).toThrow("hardened segments");
  });
});
