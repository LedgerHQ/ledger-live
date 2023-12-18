import invariant from "invariant";
import { Observable, defer, of, range, empty } from "rxjs";
import { catchError, switchMap, concatMap, takeWhile, map } from "rxjs/operators";
import { log } from "@ledgerhq/logs";
import { TransportStatusError, UserRefusedAddress } from "@ledgerhq/errors";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "./currencies";
import { getEnv } from "@ledgerhq/live-env";

export type ModeSpec = {
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
  overridesCoinType?: number;
  // force a given cointype
  purpose?: number;
  isInvalid?: boolean;
  // invalid means it's not a path we ever supported. some users fall into this and we support scanning for them in SCAN_FOR_INVALID_PATHS is set.
  tag?: string;
  addressFormat?: string;
};

// FIXME: DerivationMode SHOULD BE IN LIVE-TYPES ?
// IN LIVE-TYPES DerivationMode = string which does not work
export type DerivationMode = keyof typeof modes;

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

const modes = Object.freeze({
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
  // Deprecated and should no longer be used.
  bch_on_bitcoin_segwit: {
    overridesCoinType: 0,
    isInvalid: true,
    isSegwit: true,
    purpose: 49,
    addressFormat: "p2sh",
  },
  // many users have wrongly sent BTC on BCH paths
  legacy_on_bch: {
    overridesCoinType: 145,
    isInvalid: true,
  },
  // chrome app and LL wrongly used to derivate vertcoin on 128
  vertcoin_128: {
    tag: "legacy",
    overridesCoinType: 128,
  },
  vertcoin_128_segwit: {
    tag: "legacy",
    overridesCoinType: 128,
    isSegwit: true,
    purpose: 49,
    addressFormat: "p2sh",
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
  segwit_on_legacy: {
    isSegwit: true,
    purpose: 44,
    addressFormat: "p2sh",
    isInvalid: true,
  },
  legacy_on_segwit: {
    purpose: 49,
    isInvalid: true,
  },
  legacy_on_native_segwit: {
    purpose: 84,
    isInvalid: true,
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
    overridesDerivation: "44'/1'/0'/0/<address>",
    tag: "legacy",
  },
  ledgerLiveStandard: {
    overridesDerivation: "44'/<coin_type>'/<address>'/<node>/<account>",
    startsAt: 1,
    tag: "third-party",
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
  vechain: {
    overridesDerivation: "44'/818'/0'/0/<account>",
  },
  internet_computer: {
    overridesDerivation: "44'/223'/0'/0/<account>",
  },
  stacks_wallet: {
    overridesDerivation: "44'/5757'/0'/0/<account>",
    startsAt: 1,
    tag: "third-party",
  },
});
modes as Record<DerivationMode, ModeSpec>; // eslint-disable-line

const legacyDerivations: Partial<Record<CryptoCurrency["id"], DerivationMode[]>> = {
  aeternity: ["aeternity"],
  bitcoin_cash: [],
  bitcoin: ["legacy_on_bch"],
  vertcoin: ["vertcoin_128", "vertcoin_128_segwit"],
  tezos: ["galleonL", "tezboxL", "tezosbip44h", "tezbox"],
  stellar: ["sep5"],
  polkadot: ["polkadotbip44"],
  hedera: ["hederaBip44"],
  filecoin: ["glifLegacy", "ledgerLiveStandard"],
  internet_computer: ["internet_computer"],
  casper: ["casper_wallet"],
  cardano: ["cardano"],
  cardano_testnet: ["cardano"],
  near: ["nearbip44h"],
  vechain: ["vechain"],
  stacks: ["stacks_wallet"],
  ethereum: ["ethM", "ethMM"],
  ethereum_classic: ["ethM", "ethMM", "etcM"],
  solana: ["solanaMain", "solanaSub"],
  solana_devnet: ["solanaMain", "solanaSub"],
  solana_testnet: ["solanaMain", "solanaSub"],
};

export const asDerivationMode = (derivationMode: string): DerivationMode => {
  invariant(derivationMode in modes, "not a derivationMode. Got: '%s'", derivationMode);
  return derivationMode as DerivationMode;
};
export const getAllDerivationModes = (): DerivationMode[] => Object.keys(modes) as DerivationMode[];
export const getMandatoryEmptyAccountSkip = (derivationMode: DerivationMode): number =>
  (modes[derivationMode] as { mandatoryEmptyAccountSkip: number }).mandatoryEmptyAccountSkip || 0;
export const isInvalidDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isInvalid: boolean }).isInvalid || false;
export const isSegwitDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isSegwit: boolean }).isSegwit || false;
export const isNativeSegwitDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isNativeSegwit: boolean }).isNativeSegwit || false;
export const isTaprootDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isTaproot: boolean }).isTaproot || false;

export const isUnsplitDerivationMode = (derivationMode: DerivationMode): boolean =>
  (modes[derivationMode] as { isUnsplit: boolean }).isUnsplit || false;
export const isIterableDerivationMode = (derivationMode: DerivationMode): boolean =>
  !(modes[derivationMode] as { isNonIterable: boolean }).isNonIterable;
export const getDerivationModeStartsAt = (derivationMode: DerivationMode): number =>
  (modes[derivationMode] as { startsAt: number }).startsAt || 0;
export const getPurposeDerivationMode = (derivationMode: DerivationMode): number =>
  (modes[derivationMode] as { purpose: number }).purpose || 44;
export const getTagDerivationMode = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
): string | null | undefined => {
  const mode = modes[derivationMode] as { tag: any; isInvalid: any };

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
const currencyForceCoinType = {
  vertcoin: true,
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
  const { overridesDerivation, overridesCoinType } = modes[derivationMode] as {
    overridesDerivation: string;
    overridesCoinType: string;
  };
  if (overridesDerivation) return overridesDerivation;
  const splitFrom = isUnsplitDerivationMode(derivationMode) && currency.forkedFrom;
  const coinType = splitFrom
    ? getCryptoCurrencyById(splitFrom).coinType
    : typeof overridesCoinType === "number"
    ? overridesCoinType
    : currencyForceCoinType
    ? currency.coinType
    : "<coin_type>";
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
  tezos: true,
  // current workaround, device app does not seem to support bip44
  stellar: true,
  polkadot: true,
  solana: true,
  hedera: true,
  cardano: true,
  cardano_testnet: true,
  near: true,
  vechain: true,
  internet_computer: true,
  casper: true,
};
type SeedInfo = {
  purpose: number;
  coinType: number;
};
type SeedPathFn = (info: SeedInfo) => string;
const seedIdentifierPath: Record<string, SeedPathFn> = {
  neo: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  filecoin: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  stacks: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  solana: ({ purpose, coinType }) => `${purpose}'/${coinType}'`,
  hedera: ({ purpose, coinType }) => `${purpose}/${coinType}`,
  casper: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  cardano: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  cardano_testnet: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  internet_computer: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  near: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0'/0'`,
  vechain: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  _: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'`,
};
export const getSeedIdentifierDerivation = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
): string => {
  const unsplitFork = isUnsplitDerivationMode(derivationMode) ? currency.forkedFrom : null;
  const purpose = getPurposeDerivationMode(derivationMode);
  const { coinType } = unsplitFork ? getCryptoCurrencyById(unsplitFork) : currency;
  const f = seedIdentifierPath[currency.id] || seedIdentifierPath._;
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

  if (currency.supportsSegwit) {
    all.push("segwit_on_legacy", "legacy_on_segwit", "legacy_on_native_segwit");
  }

  if (currency.supportsNativeSegwit) {
    all.push("native_segwit");
  }

  // taproot logic. FIXME should move per family
  if (currency.family === "bitcoin") {
    if (currency.id === "bitcoin" || currency.id === "bitcoin_testnet") {
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
export type StepAddressInput = {
  index: number;
  parentDerivation: Result;
  accountDerivation: Result;
  derivationMode: DerivationMode;
  shouldSkipEmpty: boolean;
  seedIdentifier: string;
};
export type WalletDerivationInput<R> = {
  currency: CryptoCurrency;
  derivationMode: DerivationMode;
  derivateAddress: (arg0: GetAddressOptions) => Observable<Result>;
  stepAddress: (arg0: StepAddressInput) => Observable<{
    result?: R;
    complete?: boolean;
  }>;
  shouldDerivesOnAccount?: boolean;
};
export function walletDerivation<R>({
  currency,
  derivationMode,
  derivateAddress,
  stepAddress,
  shouldDerivesOnAccount,
}: WalletDerivationInput<R>): Observable<R> {
  const path = getSeedIdentifierDerivation(currency, derivationMode);
  return defer(() =>
    derivateAddress({
      currency,
      path,
      derivationMode,
    }).pipe(
      catchError(e => {
        if (e instanceof TransportStatusError || e instanceof UserRefusedAddress) {
          log("scanAccounts", "ignore derivationMode=" + derivationMode);
        }

        return empty();
      }),
    ),
  ).pipe(
    switchMap(parentDerivation => {
      const seedIdentifier = parentDerivation.publicKey;
      const emptyCount = 0;
      const mandatoryEmptyAccountSkip = getMandatoryEmptyAccountSkip(derivationMode);
      const derivationScheme = getDerivationScheme({
        derivationMode,
        currency,
      });
      const stopAt = isIterableDerivationMode(derivationMode) ? 255 : 1;
      const startsAt = getDerivationModeStartsAt(derivationMode);
      return range(startsAt, stopAt - startsAt).pipe(
        // derivate addresses/xpubs
        concatMap(index => {
          if (!derivationModeSupportsIndex(derivationMode, index)) {
            return empty();
          }

          const path = shouldDerivesOnAccount
            ? runAccountDerivationScheme(derivationScheme, currency, {
                account: index,
              })
            : runDerivationScheme(derivationScheme, currency, {
                account: index,
              });
          return derivateAddress({
            currency,
            path,
            derivationMode,
          }).pipe(
            map(accountDerivation => ({
              parentDerivation,
              accountDerivation,
              index,
            })),
          );
        }), // do action with these derivations (e.g. synchronize)
        concatMap(({ parentDerivation, accountDerivation, index }) =>
          stepAddress({
            index,
            parentDerivation,
            accountDerivation,
            derivationMode,
            shouldSkipEmpty: emptyCount < mandatoryEmptyAccountSkip,
            seedIdentifier,
          }),
        ), // take until the list is complete (based on criteria defined by stepAddress)
        // $FlowFixMe
        takeWhile(r => !r.complete, true), // emit just the results
        concatMap(({ result }) => (result ? of(result) : empty())),
      );
    }),
  );
}
