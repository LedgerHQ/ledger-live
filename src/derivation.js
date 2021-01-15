// @flow
import invariant from "invariant";
import { Observable, defer, of, range, empty } from "rxjs";
import {
  catchError,
  switchMap,
  concatMap,
  takeWhile,
  map,
} from "rxjs/operators";
import { log } from "@ledgerhq/logs";
import { TransportStatusError, UserRefusedAddress } from "@ledgerhq/errors";
import type { CryptoCurrency, CryptoCurrencyConfig } from "./types";
import { getCryptoCurrencyById } from "./currencies";
import { getEnv } from "./env";
import type { GetAddressOptions, Result } from "./hw/getAddress/types";

type LibcoreConfig = {
  [_: string]: mixed,
};

export type ModeSpec = {
  mandatoryEmptyAccountSkip?: number,
  isNonIterable?: boolean,
  startsAt?: number,
  overridesDerivation?: string,
  libcoreConfig?: LibcoreConfig,
  isSegwit?: boolean, // TODO drop
  isUnsplit?: boolean, // TODO drop
  skipFirst?: true,
  overridesCoinType?: number, // force a given cointype
  purpose?: number,
  isInvalid?: boolean, // invalid means it's not a path we ever supported. some users fall into this and we support scanning for them in SCAN_FOR_INVALID_PATHS is set.
  tag?: string,
  addressFormat?: string,
};

export type DerivationMode = $Keys<typeof modes>;

const extraConfigPerCurrency: { [_: string]: LibcoreConfig } = {
  tezos: {
    BLOCKCHAIN_EXPLORER_ENGINE: "TZSTATS_API",
    BLOCKCHAIN_EXPLORER_API_ENDPOINT: () =>
      getEnv("API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT"),
    TEZOS_PROTOCOL_UPDATE: "TEZOS_PROTOCOL_UPDATE_BABYLON",
    TEZOS_NODE: () => getEnv("API_TEZOS_NODE"),
  },
  cosmos: {
    BLOCKCHAIN_EXPLORER_API_ENDPOINT: () =>
      getEnv("API_COSMOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT"),
  },
  algorand: {
    BLOCKCHAIN_EXPLORER_API_ENDPOINT: () =>
      getEnv("API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT"),
    BLOCKCHAIN_EXPLORER_API_KEY: () =>
      getEnv("API_ALGORAND_BLOCKCHAIN_EXPLORER_API_KEY"),
  },
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
    skipFirst: true, // already included in the normal bip44,
    tag: "metamask",
  },
  // Deprecated and should no longer be used.
  bch_on_bitcoin_segwit: {
    overridesCoinType: 0,
    isInvalid: true,
    isSegwit: true,
    purpose: 49,
    libcoreConfig: {
      KEYCHAIN_ENGINE: "BIP49_P2SH",
    },
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
    libcoreConfig: {
      KEYCHAIN_ENGINE: "BIP49_P2SH",
    },
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
    libcoreConfig: {
      TEZOS_XPUB_CURVE: "ED25519",
    },
  },
  tezosbip44h: {
    tag: "galleon",
    overridesDerivation: "44'/1729'/<account>'/0'/0'",
    libcoreConfig: {
      TEZOS_XPUB_CURVE: "ED25519",
    },
  },
  galleonL: {
    tag: "legacy",
    startsAt: 1,
    overridesDerivation: "44'/1729'/0'/0'/<account>'",
    libcoreConfig: {
      TEZOS_XPUB_CURVE: "ED25519",
    },
  },
  tezboxL: {
    tag: "legacy",
    startsAt: 1,
    overridesDerivation: "44'/1729'/0'/<account>'",
    libcoreConfig: {
      TEZOS_XPUB_CURVE: "ED25519",
    },
  },
  native_segwit: {
    purpose: 84,
    libcoreConfig: {
      KEYCHAIN_ENGINE: "BIP173_P2WPKH",
    },
    addressFormat: "bech32",
    tag: "native segwit",
    isSegwit: true,
  },
  segwit: {
    isSegwit: true,
    purpose: 49,
    libcoreConfig: {
      KEYCHAIN_ENGINE: "BIP49_P2SH",
    },
    tag: "segwit",
    addressFormat: "p2sh",
  },
  segwit_on_legacy: {
    isSegwit: true,
    purpose: 44,
    libcoreConfig: {
      KEYCHAIN_ENGINE: "BIP49_P2SH",
    },
    addressFormat: "p2sh",
    isInvalid: true,
  },
  legacy_on_segwit: {
    purpose: 49,
    libcoreConfig: {
      KEYCHAIN_ENGINE: "BIP32_P2PKH",
    },
    isInvalid: true,
  },
  legacy_on_native_segwit: {
    purpose: 84,
    libcoreConfig: {
      KEYCHAIN_ENGINE: "BIP32_P2PKH",
    },
    isInvalid: true,
  },
  segwit_unsplit: {
    isSegwit: true,
    purpose: 49,
    libcoreConfig: {
      KEYCHAIN_ENGINE: "BIP49_P2SH",
    },
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
});

(modes: { [_: DerivationMode]: ModeSpec }); // eslint-disable-line

const legacyDerivations: $Shape<CryptoCurrencyConfig<DerivationMode[]>> = {
  aeternity: ["aeternity"],
  bitcoin_cash: [],
  bitcoin: ["legacy_on_bch"],
  vertcoin: ["vertcoin_128", "vertcoin_128_segwit"],
  ethereum: ["ethM", "ethMM"],
  ethereum_classic: ["ethM", "etcM", "ethMM"],
  tezos: ["galleonL", "tezboxL", "tezosbip44h", "tezbox"],
  stellar: ["sep5"],
  polkadot: ["polkadotbip44"],
};

export const asDerivationMode = (derivationMode: string): DerivationMode => {
  invariant(
    derivationMode in modes,
    "not a derivationMode. Got: '%s'",
    derivationMode
  );
  // $FlowFixMe flow limitation
  return derivationMode;
};

export const getAllDerivationModes = (): DerivationMode[] => Object.keys(modes);

export const getMandatoryEmptyAccountSkip = (
  derivationMode: DerivationMode
): number => modes[derivationMode].mandatoryEmptyAccountSkip || 0;

export const isInvalidDerivationMode = (
  derivationMode: DerivationMode
): boolean => modes[derivationMode].isInvalid || false;

export const isSegwitDerivationMode = (
  derivationMode: DerivationMode
): boolean => modes[derivationMode].isSegwit || false;

export const getLibcoreConfig = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
): { [_: string]: mixed } => {
  const obj = {};
  const extra = {
    ...extraConfigPerCurrency[currency.id],
    // $FlowFixMe
    ...modes[derivationMode].libcoreConfig,
  };
  for (let k in extra) {
    const v = extra[k];
    if (typeof v === "function") {
      // $FlowFixMe
      obj[k] = v();
    } else {
      obj[k] = v;
    }
  }
  return obj;
};

export const isUnsplitDerivationMode = (
  derivationMode: DerivationMode
): boolean => modes[derivationMode].isUnsplit || false;

export const isIterableDerivationMode = (
  derivationMode: DerivationMode
): boolean => !modes[derivationMode].isNonIterable;

export const getDerivationModeStartsAt = (
  derivationMode: DerivationMode
): number => modes[derivationMode].startsAt || 0;

export const getPurposeDerivationMode = (
  derivationMode: DerivationMode
): number => modes[derivationMode].purpose || 44;

export const getTagDerivationMode = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
): ?string => {
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

export const getAddressFormatDerivationMode = (
  derivationMode: DerivationMode
): string => modes[derivationMode].addressFormat || "legacy";

export const derivationModeSupportsIndex = (
  derivationMode: DerivationMode,
  index: number
): boolean => {
  const mode = modes[derivationMode];
  if (mode.skipFirst && index === 0) return false;
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
  derivationMode: DerivationMode,
  currency: CryptoCurrency,
}): string => {
  const { overridesDerivation, overridesCoinType } = modes[derivationMode];
  if (overridesDerivation) return overridesDerivation;
  const splitFrom =
    isUnsplitDerivationMode(derivationMode) && currency.forkedFrom;
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
  { coinType }: { coinType: number },
  opts: {
    account?: number | string,
    node?: number | string,
    address?: number | string,
  } = {}
) =>
  derivationScheme
    .replace("<coin_type>", String(coinType))
    .replace("<account>", String(opts.account || 0))
    .replace("<node>", String(opts.node || 0))
    .replace("<address>", String(opts.address || 0));

// execute the derivation on the account part of the scheme
export const runAccountDerivationScheme = (
  scheme: string,
  currency: { coinType: number },
  opts: {
    account?: number | string,
  } = {}
) =>
  runDerivationScheme(scheme, currency, {
    ...opts,
    address: "_",
    node: "_",
  }).replace(/[_/]+$/, "");

const disableBIP44 = {
  aeternity: true,
  tezos: true, // current workaround, device app does not seem to support bip44
  stellar: true,
  polkadot: true,
};

const seedIdentifierPath = {
  neo: ({ purpose, coinType }) => `${purpose}'/${coinType}'/0'/0/0`,
  _: ({ purpose, coinType }) => `${purpose}'/${coinType}'`,
};

export const getSeedIdentifierDerivation = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
): string => {
  const unsplitFork = isUnsplitDerivationMode(derivationMode)
    ? currency.forkedFrom
    : null;
  const purpose = getPurposeDerivationMode(derivationMode);
  const { coinType } = unsplitFork
    ? getCryptoCurrencyById(unsplitFork)
    : currency;
  const f = seedIdentifierPath[currency.id] || seedIdentifierPath._;
  return f({ purpose, coinType });
};

// return an array of ways to derivate, by convention the latest is the standard one.
export const getDerivationModesForCurrency = (
  currency: CryptoCurrency
): DerivationMode[] => {
  const all =
    currency.id in legacyDerivations
      ? legacyDerivations[currency.id].slice(0)
      : [];
  if (currency.forkedFrom) {
    all.push("unsplit");
    if (currency.supportsSegwit) {
      all.push("segwit_unsplit");
    }
  }
  if (currency.supportsSegwit) {
    all.push("segwit_on_legacy");
    all.push("legacy_on_segwit");
    all.push("legacy_on_native_segwit");
  }
  if (!disableBIP44[currency.id]) {
    all.push("");
  }
  if (currency.supportsNativeSegwit) {
    all.push("native_segwit");
  }
  if (currency.supportsSegwit) {
    all.push("segwit");
  }
  if (!getEnv("SCAN_FOR_INVALID_PATHS")) {
    return all.filter((a) => !isInvalidDerivationMode(a));
  }
  return all;
};

export type StepAddressInput = {
  index: number,
  parentDerivation: Result,
  accountDerivation: Result,
  derivationMode: DerivationMode,
  shouldSkipEmpty: boolean,
  seedIdentifier: string,
};

export type WalletDerivationInput<R> = {
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
  derivateAddress: (GetAddressOptions) => Observable<Result>,
  stepAddress: (StepAddressInput) => Observable<{
    result?: R,
    complete?: boolean,
  }>,
  shouldDerivesOnAccount?: boolean,
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
      catchError((e) => {
        if (
          e instanceof TransportStatusError ||
          e instanceof UserRefusedAddress
        ) {
          log("scanAccounts", "ignore derivationMode=" + derivationMode);
        }
        return empty();
      })
    )
  ).pipe(
    switchMap((parentDerivation) => {
      const seedIdentifier = parentDerivation.publicKey;

      let emptyCount = 0;
      const mandatoryEmptyAccountSkip = getMandatoryEmptyAccountSkip(
        derivationMode
      );
      const derivationScheme = getDerivationScheme({
        derivationMode,
        currency,
      });
      const stopAt = isIterableDerivationMode(derivationMode) ? 255 : 1;
      const startsAt = getDerivationModeStartsAt(derivationMode);
      return range(startsAt, stopAt - startsAt).pipe(
        // derivate addresses/xpubs
        concatMap((index) => {
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

          return derivateAddress({ currency, path, derivationMode }).pipe(
            map((accountDerivation) => ({
              parentDerivation,
              accountDerivation,
              index,
            }))
          );
        }),
        // do action with these derivations (e.g. synchronize)
        concatMap(({ parentDerivation, accountDerivation, index }) =>
          stepAddress({
            index,
            parentDerivation,
            accountDerivation,
            derivationMode,
            shouldSkipEmpty: emptyCount < mandatoryEmptyAccountSkip,
            seedIdentifier,
          })
        ),
        // take until the list is complete (based on criteria defined by stepAddress)
        // $FlowFixMe
        takeWhile((r) => !r.complete, true),
        // emit just the results
        concatMap(({ result }) => (result ? of(result) : empty()))
      );
    })
  );
}
