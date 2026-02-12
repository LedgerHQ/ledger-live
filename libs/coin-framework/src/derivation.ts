import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { DerivationMode } from "@ledgerhq/types-live";

type ModeSpec = {
  mandatoryEmptyAccountSkip?: number;
  isNonIterable?: boolean;
  startsAt?: number;
  overridesDerivation?: string;
  isSegwit?: boolean;
  isNativeSegwit?: boolean;
  isTaproot?: boolean;
  // TODO drop
  isUnsplit?: boolean;
  // TODO drop
  skipFirst?: true;
  // force a given cointype
  purpose?: number;
  isInvalid?: boolean;
  // invalid means it's not a path we ever supported. some users fall into this and we support scanning for them in SCAN_FOR_INVALID_PATHS is set.
  tag?: string;
  addressFormat?: string;
};

export type Result = {
  address: string;
  path: string;
  publicKey: string;
  chainCode?: string;
};
export type GetAddressOptions = {
  currency: CryptoCurrency;
  path: string;
  derivationMode: DerivationMode;
  verify?: boolean;
  askChainCode?: boolean;
  forceFormat?: string;
  devicePath?: string;
  segwit?: boolean;
};

const modes: Readonly<Record<DerivationMode, ModeSpec>> = Object.freeze({
  // this is "default" by convention
  "": {},
  // MEW legacy derivation
  ethM: {
    mandatoryEmptyAccountSkip: 10,
    overridesDerivation: "44'/60'/0'/<account>",
    tag: "legacy",
  },
  // MetaMask style
  ethMM: {
    overridesDerivation: "44'/60'/0'/0/<account>",
    skipFirst: true,
    // already included in the normal bip44,
    tag: "metamask",
  },
  // MEW legacy derivation for eth
  etcM: {
    mandatoryEmptyAccountSkip: 10,
    overridesDerivation: "44'/60'/160720'/0'/<account>",
    tag: "legacy",
  },
  aeternity: {
    overridesDerivation: "<account>",
  },
  // default derivation of tezbox offerred to users
  tezbox: {
    overridesDerivation: "44'/1729'/<account>'/0'",
  },
  tezosbip44h: {
    tag: "galleon",
    overridesDerivation: "44'/1729'/<account>'/0'/0'",
  },
  galleonL: {
    tag: "legacy",
    startsAt: 1,
    overridesDerivation: "44'/1729'/0'/0'/<account>'",
  },
  tezboxL: {
    tag: "legacy",
    startsAt: 1,
    overridesDerivation: "44'/1729'/0'/<account>'",
  },
  taproot: {
    purpose: 86,
    addressFormat: "bech32m",
    tag: "taproot",
    isSegwit: true,
    isTaproot: true,
  },
  native_segwit: {
    purpose: 84,
    addressFormat: "bech32",
    tag: "native segwit",
    isSegwit: true,
    isNativeSegwit: true,
  },
  segwit: {
    isSegwit: true,
    purpose: 49,
    tag: "segwit",
    addressFormat: "p2sh",
  },
  segwit_unsplit: {
    isSegwit: true,
    purpose: 49,
    addressFormat: "p2sh",
    isUnsplit: true,
    tag: "segwit unsplit",
  },
  sep5: {
    overridesDerivation: "44'/148'/<account>'",
  },
  unsplit: {
    isUnsplit: true,
    tag: "unsplit",
  },
  polkadotbip44: {
    overridesDerivation: "44'/354'/<account>'/0'/<address>'",
  },
  glifLegacy: {
    overridesDerivation: "44'/1'/0'/0/<account>",
    tag: "legacy",
    mandatoryEmptyAccountSkip: 5,
  },
  glif: {
    overridesDerivation: "44'/461'/0'/0/<account>",
    tag: "third-party",
    mandatoryEmptyAccountSkip: 5,
  },
  filecoinBIP44: {
    overridesDerivation: "44'/<coin_type>'/<account>'/<node>/<address>",
    startsAt: 1,
    tag: "bip44",
    mandatoryEmptyAccountSkip: 5,
  },
  casper_wallet: {
    overridesDerivation: "44'/506'/0'/0/<account>",
  },
  solanaMain: {
    isNonIterable: true,
    overridesDerivation: "44'/501'",
  },
  solanaSub: {
    overridesDerivation: "44'/501'/<account>'",
  },
  solanaBip44Change: {
    overridesDerivation: "44'/501'/<account>'/0'",
    mandatoryEmptyAccountSkip: 10,
  },
  hederaBip44: {
    overridesDerivation: "44/3030",
  },
  cardano: {
    purpose: 1852,
    overridesDerivation: "1852'/1815'/<account>'/<node>/<address>",
  },
  nearbip44h: {
    overridesDerivation: "44'/397'/0'/0'/<account>'",
    mandatoryEmptyAccountSkip: 1,
  },
  icon: {
    overridesDerivation: "44'/4801368'/0'/0'/<account>'",
  },
  vechain: {
    overridesDerivation: "44'/818'/0'/0/<account>",
  },
  internet_computer: {
    overridesDerivation: "44'/223'/0'/0/<account>",
  },
  minabip44: {
    overridesDerivation: "44'/12586'/<account>'/0/0",
  },
  stacks_wallet: {
    overridesDerivation: "44'/5757'/0'/0/<account>",
    startsAt: 1,
    tag: "third-party",
  },
  aptos: {
    overridesDerivation: "44'/637'/<account>'/0'/0'",
  },
  ton: {
    overridesDerivation: "44'/607'/0'/0'/<account>'/0'",
  },
  sui: {
    overridesDerivation: "44'/784'/<account>'/0'/0'",
  },
  canton: {
    overridesDerivation: "44'/6767'/<account>'/0'/0'",
    tag: "canton",
  },
  cashaddr: {
    addressFormat: "cashaddr",
    tag: "cashaddr",
  },
  celo: {
    tag: "Legacy",
  },
  celoMM: {
    overridesDerivation: "44'/60'/0'/0/<account>",
    tag: "Metamask",
  },
  celoEvm: {
    overridesDerivation: "44'/60'/<account>'/0'/0'",
  },
  aleo: {
    overridesDerivation: "44'/683'/<account>",
  },
});

// WIP
/**
 * Add support for new blockchain derivation path mode.
 * To use in future dev* to remove the hardcoded list `modes` and
 * separate the dependency with all coin logic.
 */
// export function addDerivationMode({ mode, spec }: { mode: DerivationMode; spec: ModeSpec }) {
//   modes[mode] = spec;
// }

const legacyDerivations: Partial<Record<CryptoCurrency["id"], DerivationMode[]>> = {
  aeternity: ["aeternity"],
  bitcoin_cash: [],
  tezos: ["galleonL", "tezboxL", "tezosbip44h", "tezbox"],
  stellar: ["sep5"],
  polkadot: ["polkadotbip44"],
  westend: ["polkadotbip44"],
  assethub_polkadot: ["polkadotbip44"],
  assethub_westend: ["polkadotbip44"],
  hedera: ["hederaBip44"],
  filecoin: ["glifLegacy", "filecoinBIP44", "glif"],
  internet_computer: ["internet_computer"],
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
  aptos: ["aptos"],
  canton_network: ["canton"],
  canton_network_devnet: ["canton"],
  canton_network_testnet: ["canton"],
  celo: ["celo", "celoMM", "celoEvm"],
  aleo: ["aleo"],
  aleo_testnet: ["aleo"],
};

export function isDerivationMode(mode: string): mode is DerivationMode {
  return mode in modes;
}
export const asDerivationMode = (derivationMode: string): DerivationMode => {
  if (!isDerivationMode(derivationMode)) {
    throw new Error(`${derivationMode} is not a derivationMode`);
  }
  return derivationMode;
};
export const getAllDerivationModes = (): DerivationMode[] => Object.keys(modes) as DerivationMode[];
export const getMandatoryEmptyAccountSkip = (derivationMode: DerivationMode): number =>
  modes[derivationMode]?.mandatoryEmptyAccountSkip ?? 0;
export const isInvalidDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isInvalid: boolean }).isInvalid || false;
export const isSegwitDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isSegwit: boolean }).isSegwit || false;
export const isNativeSegwitDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isNativeSegwit: boolean }).isNativeSegwit || false;
export const isTaprootDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isTaproot: boolean }).isTaproot || false;
const isUnsplitDerivationMode = (derivationMode: DerivationMode): boolean =>
  modes[derivationMode]?.isUnsplit ?? false;
export const isIterableDerivationMode = (derivationMode: DerivationMode): boolean =>
  !(modes[derivationMode] as { isNonIterable: boolean }).isNonIterable;
export const getDerivationModeStartsAt = (derivationMode: DerivationMode): number =>
  (modes[derivationMode] as { startsAt: number }).startsAt || 0;
const getPurposeDerivationMode = (derivationMode: DerivationMode): number =>
  modes[derivationMode]?.purpose ?? 44;
export const getTagDerivationMode = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
): string | null | undefined => {
  const mode = modes[derivationMode];

  if (mode.tag) {
    return mode.tag;
  }

  if (mode.isInvalid) {
    return "custom";
  }

  if (currency.supportsSegwit && !isSegwitDerivationMode(derivationMode)) {
    return "legacy";
  }

  return null;
};
export const getAddressFormatDerivationMode = (derivationMode: DerivationMode): string =>
  (modes[derivationMode] as { addressFormat: string }).addressFormat || "legacy";
export const derivationModeSupportsIndex = (
  derivationMode: DerivationMode,
  index: number,
): boolean => {
  const mode = modes[derivationMode];
  if ((mode as { skipFirst: boolean }).skipFirst && index === 0) return false;
  return true;
};

/**
 * return a ledger-lib-core compatible DerivationScheme format
 * for a given currency and derivationMode (you can pass an Account because same shape)
 */
export const getDerivationScheme = ({
  derivationMode,
  currency,
}: {
  derivationMode: DerivationMode;
  currency: CryptoCurrency;
}): string => {
  const { overridesDerivation } = modes[derivationMode] as {
    overridesDerivation: string;
  };
  if (overridesDerivation) return overridesDerivation;
  const splitFrom = isUnsplitDerivationMode(derivationMode) && currency.forkedFrom;
  const coinType = splitFrom ? getCryptoCurrencyById(splitFrom).coinType : "<coin_type>";
  const purpose = getPurposeDerivationMode(derivationMode);
  return `${purpose}'/${coinType}'/<account>'/<node>/<address>`;
};

// Execute a derivation scheme
export const runDerivationScheme = (
  derivationScheme: string,
  {
    coinType,
  }: {
    coinType: number;
  },
  opts: {
    account?: number | string;
    node?: number | string;
    address?: number | string;
  } = {},
) =>
  derivationScheme
    .replace("<coin_type>", String(coinType))
    .replace("<account>", String(opts.account || 0))
    .replace("<node>", String(opts.node || 0))
    .replace("<address>", String(opts.address || 0));
// execute the derivation on the account part of the scheme
export const runAccountDerivationScheme = (
  scheme: string,
  currency: {
    coinType: number;
  },
  opts: {
    account?: number | string;
  } = {},
) =>
  runDerivationScheme(scheme, currency, {
    ...opts,
    address: "_",
    node: "_",
  }).replace(/[_/]+$/, "");

const disableBIP44: Record<string, boolean> = {
  aeternity: true,
  aptos: true,
  tezos: true,
  // current workaround, device app does not seem to support bip44
  stellar: true,
  polkadot: true,
  assethub_polkadot: true,
  westend: true,
  assethub_westend: true,
  solana: true,
  hedera: true,
  cardano: true,
  cardano_testnet: true,
  near: true,
  icon: true,
  icon_berlin_testnet: true,
  vechain: true,
  internet_computer: true,
  casper: true,
  filecoin: true,
  ton: true,
  sui: true,
  canton_network: true,
  canton_network_devnet: true,
  canton_network_testnet: true,
  celo: true,
  aleo: true,
  aleo_testnet: true,
};
type SeedInfo = {
  purpose: number;
  coinType: number;
};
type SeedPathFn = (info: SeedInfo) => string;
const seedIdentifierPath = (currencyId: string): SeedPathFn => {
  switch (currencyId) {
    case "neo":
    case "filecoin":
    case "stacks":
    case "casper":
    case "cardano":
    case "cardano_testnet":
    case "internet_computer":
    case "vechain":
    case "mina":
      return ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`;
    case "solana":
      return ({ purpose, coinType }) => `${purpose}'/${coinType}'`;
    case "hedera":
      return ({ purpose, coinType }) => `${purpose}/${coinType}`;
    case "near":
      return ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0'/0'`;
    case "ton":
    case "sui":
      return ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0'/0'/0'`;
    case "canton_network":
    case "canton_network_devnet":
    case "canton_network_testnet":
      return ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0'/0'`;
    case "aleo":
    case "aleo_testnet":
      return ({ purpose, coinType }) => `${purpose}'/${coinType}'/0`;
    default:
      return ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'`;
  }
};
export const getSeedIdentifierDerivation = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
): string => {
  const unsplitFork = isUnsplitDerivationMode(derivationMode) ? currency.forkedFrom : null;
  const purpose = getPurposeDerivationMode(derivationMode);
  const { coinType } = unsplitFork ? getCryptoCurrencyById(unsplitFork) : currency;
  const f = seedIdentifierPath(currency.id);
  return f({
    purpose,
    coinType,
  });
};

// return an array of ways to derivate, by convention the latest is the standard one.
export const getDerivationModesForCurrency = (currency: CryptoCurrency): DerivationMode[] => {
  let all: DerivationMode[] = [];
  if (currency.id in legacyDerivations) {
    all = all.concat(legacyDerivations[currency.id] || []);
  }
  if (currency.forkedFrom) {
    all.push("unsplit");

    if (currency.supportsSegwit) {
      all.push("segwit_unsplit");
    }
  }

  if (currency.supportsNativeSegwit) {
    all.push("native_segwit");
  }

  // taproot logic. FIXME should move per family
  if (currency.family === "bitcoin") {
    if (
      currency.id === "bitcoin" ||
      currency.id === "bitcoin_testnet" ||
      currency.id === "bitcoin_regtest"
    ) {
      all.push("taproot");
    }
  }

  // Can't this be concatenated with the first `supportsSegwit` condition ?
  if (currency.supportsSegwit) {
    all.push("segwit");
  }

  if (!disableBIP44[currency.id]) {
    all.push("");
  }

  if (!getEnv("SCAN_FOR_INVALID_PATHS")) {
    return all.filter(a => !isInvalidDerivationMode(a));
  }

  return all;
};

const preferredList: DerivationMode[] = ["native_segwit", "taproot", "segwit", ""];
// null => no settings
// [ .. ]
export const getPreferredNewAccountScheme = (
  currency: CryptoCurrency,
): DerivationMode[] | null | undefined => {
  if (currency.family !== "bitcoin") return null;
  const derivationsModes = getDerivationModesForCurrency(currency);
  const list = preferredList.filter(p => derivationsModes.includes(p as DerivationMode));
  if (list.length === 1) return null;
  return list as DerivationMode[];
};

export const getDefaultPreferredNewAccountScheme = (
  currency: CryptoCurrency,
): DerivationMode | null | undefined => {
  const list = getPreferredNewAccountScheme(currency);
  return list && list[0];
};
