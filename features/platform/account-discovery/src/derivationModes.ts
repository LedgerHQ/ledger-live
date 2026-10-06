import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";

/**
 * The derivation modes of the legacy scan, as data. A table copy of
 * `ledger-wallet-framework/derivation.ts`, so discovery does not depend on `libs/`; the parity test
 * in live-common fails if the two drift.
 */
export type DerivationModeSpec = {
  /** Consecutive empty accounts tolerated before the scan of the mode stops. */
  readonly mandatoryEmptyAccountSkip?: number;
  /** The mode has a single account. */
  readonly isNonIterable?: boolean;
  readonly startsAt?: number;
  readonly overridesDerivation?: string;
  readonly purpose?: number;
  /** The coin type is the one of the currency this one forked from. */
  readonly isUnsplit?: boolean;
  /** Index 0 is covered by another mode. */
  readonly skipFirst?: boolean;
};

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
  glifLegacy: {
    overridesDerivation: "44'/1'/0'/0/<account>",
    mandatoryEmptyAccountSkip: 5,
  },
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

const specOf = (mode: DerivationMode): DerivationModeSpec => DERIVATION_MODES[mode];

const LEGACY_DERIVATIONS: Readonly<Partial<Record<string, readonly DerivationMode[]>>> = {
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

// Currencies whose device app has no plain BIP44 account: the "" mode is left out.
const NO_BIP44 = new Set([
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

/** The modes a currency is scanned with, in scan order. By convention the last is the standard one. */
export function derivationModesOf(currency: CryptoCurrency): DerivationMode[] {
  const modes: DerivationMode[] = [...(LEGACY_DERIVATIONS[currency.id] ?? [])];
  if (currency.forkedFrom) {
    modes.push("unsplit");
    if (currency.supportsSegwit) modes.push("segwit_unsplit");
  }
  if (currency.supportsNativeSegwit) modes.push("native_segwit");
  if (
    currency.family === "bitcoin" &&
    (currency.id === "bitcoin" ||
      currency.id === "bitcoin_testnet" ||
      currency.id === "bitcoin_regtest")
  ) {
    modes.push("taproot");
  }
  if (currency.supportsSegwit) modes.push("segwit");
  if (!NO_BIP44.has(currency.id)) modes.push("");
  return modes;
}

export type ModeScanRules = {
  readonly startsAt: number;
  /** Exclusive upper bound of the account index. */
  readonly stopAt: number;
  readonly mandatoryEmptyAccountSkip: number;
  readonly supportsIndex: (index: number) => boolean;
};

export type DerivationRules = {
  /** `KEYCHAIN_OBSERVABLE_RANGE`: a floor for every mode's gap limit. */
  keychainObservableRange?: number;
  /** `SHOW_LEGACY_NEW_ACCOUNT`: offer a new account in the legacy "" mode. */
  showLegacyNewAccount?: boolean;
};

/** The most account indexes a mode is scanned over, as in the legacy scan. */
export const MAX_ACCOUNT_INDEX = 255;

export function scanRulesOf(mode: DerivationMode, rules: DerivationRules = {}): ModeScanRules {
  const spec = specOf(mode);
  return {
    startsAt: spec.startsAt ?? 0,
    stopAt: spec.isNonIterable ? 1 : MAX_ACCOUNT_INDEX,
    mandatoryEmptyAccountSkip: Math.max(
      spec.mandatoryEmptyAccountSkip ?? 0,
      rules.keychainObservableRange ?? 0,
    ),
    supportsIndex: index => !(spec.skipFirst && index === 0),
  };
}

/** Whether the first empty account of the mode is offered as one the user can create. */
export function offersNewAccount(
  currency: CryptoCurrency,
  mode: DerivationMode,
  rules: DerivationRules = {},
): boolean {
  const modes = derivationModesOf(currency);
  if (modes[modes.length - 1] === mode) return true;
  if (mode === "" && (rules.showLegacyNewAccount || currency.family === "bitcoin")) return true;
  return (
    mode === "segwit" ||
    (currency.family === "bitcoin" && (mode === "native_segwit" || mode === "taproot"))
  );
}

/** The scheme of a mode, as `getDerivationScheme`: `<account>`, `<node>` and `<address>` left to fill. */
export function derivationSchemeOf(currency: CryptoCurrency, mode: DerivationMode): string {
  const spec = specOf(mode);
  if (spec.overridesDerivation) return spec.overridesDerivation;
  const forkedFrom = spec.isUnsplit ? currency.forkedFrom : undefined;
  const coinType = forkedFrom ? coinTypeOf(forkedFrom) : "<coin_type>";
  return `${spec.purpose ?? 44}'/${coinType}'/<account>'/<node>/<address>`;
}

function coinTypeOf(currencyId: string): number {
  const currency = findCryptoCurrencyById(currencyId);
  if (!currency) throw new Error(`Unknown currency "${currencyId}"`);
  return currency.coinType;
}

/** Fills the scheme of an account: the full path the device derives an address at. */
export function accountPathOf(scheme: string, coinType: number, index: number): string {
  return scheme
    .replace("<coin_type>", String(coinType))
    .replace("<account>", String(index))
    .replace("<node>", "0")
    .replace("<address>", "0");
}

/** The account-level path of the scheme: what an extended public key is derived at (UTXO). */
export function accountLevelPathOf(scheme: string, coinType: number, index: number): string {
  return scheme
    .replace("<coin_type>", String(coinType))
    .replace("<account>", String(index))
    .replace("<node>", "_")
    .replace("<address>", "_")
    .replace(/[_/]+$/, "");
}
