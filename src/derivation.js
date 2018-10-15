// @flow
import invariant from "invariant";
import type { CryptoCurrency, CryptoCurrencyConfig } from "./types";
import { getCryptoCurrencyById } from "./currencies";

export type ModeSpec = {
  mandatoryEmptyAccountSkip?: number,
  isNonIterable?: boolean,
  overridesDerivation?: string,
  isSegwit?: boolean,
  isUnsplit?: boolean
};

export type DerivationMode = $Keys<typeof modes>;

const modes = Object.freeze({
  // this is "default" by convention
  "": {},

  // MEW legacy derivation
  ethM: {
    mandatoryEmptyAccountSkip: 10,
    overridesDerivation: "44'/60'/0'/<account>"
  },
  // chrome wallet legacy derivation
  ethW1: {
    isNonIterable: true,
    overridesDerivation: "44'/60'/0'/0'"
  },
  ethW2: {
    isNonIterable: true,
    overridesDerivation: "44'/60'/14'/5'/16"
  },
  // chrome ripple legacy derivations
  rip: {
    isNonIterable: true,
    overridesDerivation: "44'/144'/0'/0'"
  },
  rip2: {
    isNonIterable: true,
    overridesDerivation: "44'/144'/14'/5'/16"
  },
  // MEW legacy derivation for eth
  etcM: {
    mandatoryEmptyAccountSkip: 10,
    overridesDerivation: "44'/60'/160720'/0'/<account>"
  },
  aeternity: {
    overridesDerivation: "<account>"
  },
  segwit: {
    isSegwit: true
  },
  segwit_unsplit: {
    isSegwit: true,
    isUnsplit: true
  },
  unsplit: {
    isUnsplit: true
  }
});

(modes: { [_: DerivationMode]: ModeSpec });

const legacyDerivations: $Shape<CryptoCurrencyConfig<DerivationMode[]>> = {
  ethereum: ["ethM", "ethW1", "ethW2"],
  ethereum_classic: ["ethM", "etcM", "ethW1", "ethW2"],
  ripple: ["rip", "rip2"]
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

export const getMandatoryEmptyAccountSkip = (
  derivationMode: DerivationMode
): number => modes[derivationMode].mandatoryEmptyAccountSkip || 0;

export const isSegwitDerivationMode = (
  derivationMode: DerivationMode
): boolean => modes[derivationMode].isSegwit || false;

export const isUnsplitDerivationMode = (
  derivationMode: DerivationMode
): boolean => modes[derivationMode].isUnsplit || false;

export const isIterableDerivationMode = (
  derivationMode: DerivationMode
): boolean => !modes[derivationMode].isNonIterable;

/**
 * return a ledger-lib-core compatible DerivationScheme format
 * for a given currency and derivationMode (you can pass an Account because same shape)
 */
export const getDerivationScheme = ({
  derivationMode,
  currency
}: {
  derivationMode: DerivationMode,
  currency: CryptoCurrency
}): string => {
  const { overridesDerivation } = modes[derivationMode];
  if (overridesDerivation) return overridesDerivation;
  const splitFrom =
    isUnsplitDerivationMode(derivationMode) && currency.forkedFrom;
  const coinType = splitFrom
    ? getCryptoCurrencyById(splitFrom).coinType
    : "<coin_type>";
  const purpose = isSegwitDerivationMode(derivationMode) ? "49" : "44";
  return `${purpose}'/${coinType}'/<account>'/<node>/<address>`;
};

// Execute a derivation scheme in JS side
export const runDerivationScheme = (
  derivationScheme: string,
  { coinType }: { coinType: number },
  opts: {
    account?: number,
    node?: number,
    address?: number
  } = {}
) =>
  derivationScheme
    .replace("<coin_type>", String(coinType))
    .replace("<account>", String(opts.account || 0))
    .replace("<node>", String(opts.node || 0))
    .replace("<address>", String(opts.address || 0));

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
  all.push("");
  if (currency.supportsSegwit) {
    all.push("segwit");
  }
  if (currency.id === "aeternity") {
    return ["aeternity"];
  }
  return all;
};
