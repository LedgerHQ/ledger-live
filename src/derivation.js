// @flow
import type { CryptoCurrency } from "./types";
import { getCryptoCurrencyById } from "./currencies";

export const getMandatoryEmptyAccountSkip = (derivationMode: string): number =>
  derivationMode === "ethM" || derivationMode === "etcM" ? 10 : 0;

export const isSegwitDerivationMode = (derivationMode: string): boolean =>
  derivationMode === "segwit" || derivationMode === "segwit_unsplit";

export const isUnsplitDerivationMode = (derivationMode: string): boolean =>
  derivationMode === "unsplit" || derivationMode === "segwit_unsplit";

/**
 * return a ledger-lib-core compatible DerivationScheme format
 * for a given currency and derivationMode (you can pass an Account because same shape)
 */
export const getDerivationScheme = ({
  derivationMode,
  currency
}: {
  derivationMode: string,
  currency: CryptoCurrency
}): string => {
  const splitFrom =
    isUnsplitDerivationMode(derivationMode) && currency.forkedFrom;
  const coinType = splitFrom
    ? getCryptoCurrencyById(splitFrom).coinType
    : "<coin_type>";
  const purpose = isSegwitDerivationMode(derivationMode) ? "49" : "44";
  if (derivationMode === "ethM") {
    // old MEW derivation scheme
    return "44'/60'/0'/<account>";
  }
  if (derivationMode === "etcM") {
    // old MEW derivation scheme for ETC
    return "44'/60'/160720'/0'/<account>";
  }
  if (derivationMode === "rip") {
    // XRP legacy that the old Chrome Ripple Wallet used to wrongly derivate addresses on.
    return "44'/144'/0'/<account>'";
  }
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

const legacyDerivations = {
  ethereum: ["ethM"],
  ethereum_classic: ["ethM", "etcM"],
  ripple: ["rip"]
};

// return an array of ways to derivate, by convention the latest is the standard one.
export const getDerivationModesForCurrency = (
  currency: CryptoCurrency
): string[] => {
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
  return all;
};
