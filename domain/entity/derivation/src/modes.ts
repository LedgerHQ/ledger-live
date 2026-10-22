/** What a derivation mode changes in the scan of a currency. */
export type DerivationModeSpec = {
  /** Consecutive empty accounts tolerated before the scan of the mode stops. */
  readonly mandatoryEmptyAccountSkip?: number;
  /** The mode has a single account. */
  readonly isNonIterable?: boolean;
  readonly startsAt?: number;
  /** The scheme, with `<coin_type>`, `<account>`, `<node>` and `<address>` left to fill. */
  readonly overridesDerivation?: string;
  readonly purpose?: number;
  /** The coin type is the one of the currency this one forked from. */
  readonly isUnsplit?: boolean;
  /** Index 0 is covered by another mode. */
  readonly skipFirst?: boolean;
};

/** The modes of `ledger-wallet-framework/derivation.ts`, the fields a scan reads. "" is the BIP44 default. */
export const DERIVATION_MODES = {
  "": {},
  ethM: { mandatoryEmptyAccountSkip: 10, overridesDerivation: "44'/60'/0'/<account>" },
  ethMM: { overridesDerivation: "44'/60'/0'/0/<account>", skipFirst: true },
  etcM: { mandatoryEmptyAccountSkip: 10, overridesDerivation: "44'/60'/160720'/0'/<account>" },
  aeternity: { overridesDerivation: "<account>" },
  tezbox: { overridesDerivation: "44'/1729'/<account>'/0'" },
  tezosbip44h: { overridesDerivation: "44'/1729'/<account>'/0'/0'" },
  tezosSecp256k1: { overridesDerivation: "44'/1729'/<account>'" },
  galleonL: { startsAt: 1, overridesDerivation: "44'/1729'/0'/0'/<account>'" },
  tezboxL: { startsAt: 1, overridesDerivation: "44'/1729'/0'/<account>'" },
  taproot: { purpose: 86 },
  native_segwit: { purpose: 84 },
  segwit: { purpose: 49 },
  segwit_unsplit: { purpose: 49, isUnsplit: true },
  sep5: { overridesDerivation: "44'/148'/<account>'" },
  unsplit: { isUnsplit: true },
  polkadotbip44: { overridesDerivation: "44'/354'/<account>'/0'/<address>'" },
  glifLegacy: { overridesDerivation: "44'/1'/0'/0/<account>", mandatoryEmptyAccountSkip: 5 },
  glif: { overridesDerivation: "44'/461'/0'/0/<account>", mandatoryEmptyAccountSkip: 5 },
  filecoinBIP44: {
    overridesDerivation: "44'/<coin_type>'/<account>'/<node>/<address>",
    startsAt: 1,
    mandatoryEmptyAccountSkip: 5,
  },
  casper_wallet: { overridesDerivation: "44'/506'/0'/0/<account>" },
  solanaMain: { isNonIterable: true, overridesDerivation: "44'/501'" },
  solanaSub: { overridesDerivation: "44'/501'/<account>'" },
  solanaBip44Change: {
    overridesDerivation: "44'/501'/<account>'/0'",
    mandatoryEmptyAccountSkip: 10,
  },
  hederaBip44: { overridesDerivation: "44/3030" },
  cardano: { purpose: 1852, overridesDerivation: "1852'/1815'/<account>'/<node>/<address>" },
  nearbip44h: { overridesDerivation: "44'/397'/0'/0'/<account>'", mandatoryEmptyAccountSkip: 1 },
  icon: { overridesDerivation: "44'/4801368'/0'/0'/<account>'" },
  vechain: { overridesDerivation: "44'/818'/0'/0/<account>" },
  internet_computer: { overridesDerivation: "44'/223'/0'/0/<account>" },
  minabip44: { overridesDerivation: "44'/12586'/<account>'/0/0" },
  stacks_wallet: { overridesDerivation: "44'/5757'/0'/0/<account>", startsAt: 1 },
  aptos: { overridesDerivation: "44'/637'/<account>'/0'/0'" },
  ton: { overridesDerivation: "44'/607'/0'/0'/<account>'/0'" },
  sui: { overridesDerivation: "44'/784'/<account>'/0'/0'" },
  canton: { overridesDerivation: "44'/6767'/<account>'/0'/0'" },
  cashaddr: {},
  celo: {},
  celoMM: { overridesDerivation: "44'/60'/0'/0/<account>" },
  celoEvm: { overridesDerivation: "44'/60'/<account>'/0'/0'" },
  aleo: { overridesDerivation: "44'/683'/<account>'/0'" },
  concordium: { overridesDerivation: "44'/<coin_type>'/0'/0'/0'/<account>'" },
} as const satisfies Record<string, DerivationModeSpec>;

export type DerivationMode = keyof typeof DERIVATION_MODES;

/** The modes scanned before the standard ones, per currency id. */
export const LEGACY_MODES: Readonly<Partial<Record<string, readonly DerivationMode[]>>> = {
  aeternity: ["aeternity"],
  bitcoin_cash: [],
  tezos: ["galleonL", "tezboxL", "tezosSecp256k1", "tezosbip44h", "tezbox"],
  stellar: ["sep5"],
  polkadot: ["polkadotbip44"],
  westend: ["polkadotbip44"],
  assethub_polkadot: ["polkadotbip44"],
  assethub_westend: ["polkadotbip44"],
  bittensor: ["polkadotbip44"],
  hedera: ["hederaBip44"],
  hedera_testnet: ["hederaBip44"],
  filecoin: ["glifLegacy", "filecoinBIP44", "glif"],
  internet_computer: ["internet_computer"],
  mina: ["minabip44"],
  casper: ["casper_wallet"],
  cardano: ["cardano"],
  cardano_testnet: ["cardano"],
  near: ["nearbip44h"],
  icon: ["icon"],
  icon_berlin_testnet: ["icon"],
  vechain: ["vechain"],
  stacks: ["stacks_wallet"],
  ton: ["ton"],
  ethereum: ["ethM", "ethMM"],
  ethereum_classic: ["ethM", "ethMM", "etcM"],
  solana: ["solanaMain", "solanaBip44Change", "solanaSub"],
  solana_devnet: ["solanaMain", "solanaSub"],
  solana_testnet: ["solanaMain", "solanaSub"],
  sui: ["sui"],
  sui_testnet: ["sui"],
  aptos: ["aptos"],
  canton_network: ["canton"],
  canton_network_devnet: ["canton"],
  canton_network_testnet: ["canton"],
  celo: ["celo", "celoMM", "celoEvm"],
  aleo: ["aleo"],
  aleo_testnet: ["aleo"],
  concordium: ["concordium"],
  concordium_testnet: ["concordium"],
};

/** Currencies whose device app has no plain BIP44 account: the "" mode is left out. */
export const WITHOUT_BIP44: ReadonlySet<string> = new Set([
  "aeternity",
  "aptos",
  "tezos",
  "stellar",
  "polkadot",
  "assethub_polkadot",
  "westend",
  "assethub_westend",
  "bittensor",
  "solana",
  "solana_testnet",
  "solana_devnet",
  "hedera",
  "hedera_testnet",
  "cardano",
  "cardano_testnet",
  "near",
  "icon",
  "icon_berlin_testnet",
  "vechain",
  "internet_computer",
  "mina",
  "casper",
  "filecoin",
  "ton",
  "sui",
  "sui_testnet",
  "canton_network",
  "canton_network_devnet",
  "canton_network_testnet",
  "celo",
  "aleo",
  "aleo_testnet",
  "concordium",
  "concordium_testnet",
]);

export const WITH_TAPROOT: ReadonlySet<string> = new Set([
  "bitcoin",
  "bitcoin_testnet",
  "bitcoin_regtest",
]);

/** Per family, the modes whose first empty account is offered for creation, besides the standard one and segwit. */
export const CREATABLE_MODES_BY_FAMILY: Readonly<
  Partial<Record<string, readonly DerivationMode[]>>
> = {
  bitcoin: ["", "native_segwit", "taproot"],
};
