import Prando from "prando";
import type { CryptoCurrency, TokenCurrency } from "../types";
import { getCurrenciesResolver } from "../currencies/resolver";

/**
 * @memberof mock/account
 */
const base58Charset = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * @memberof mock/account
 */
export function genBitcoinAddressLike(rng: Prando): string {
  return `1${rng.nextString(rng.nextInt(25, 34), base58Charset)}`;
}

/**
 * @memberof mock/account
 */
export function genHex(length: number, rng: Prando): string {
  return rng.nextString(length, "0123456789ABCDEF");
}

/**
 * @memberof mock/account
 */
export function genAddress(currency: CryptoCurrency | TokenCurrency, rng: Prando): string {
  // Token accounts have no family of their own: they inherit their parent's.
  const family =
    currency.type === "CryptoCurrency"
      ? currency.family
      : getCurrenciesResolver().findCryptoCurrencyById(currency.parentCurrencyId)?.family;

  switch (family) {
    case "evm": // all evm family, includes erc20 (parent is an evm currency)
    case "hypercore": // hyperliquid derives an eth-format address
      return `0x${genHex(40, rng)}`;
    case "aleo":
      return `aleo1${rng.nextString(58, "abcdefghijklmnopqrstuvwxyz0123456789")}`;
    case "cosmos":
      return `cosmos1${rng.nextString(38, "abcdefghijklmnopqrstuvwxyz0123456789")}`;
    case "tezos":
      return `tz1${rng.nextString(33, base58Charset)}`;
    case "tron":
      return `T${rng.nextString(33, base58Charset)}`;
    case "cardano":
      return `addr1${rng.nextString(50, "abcdefghijklmnopqrstuvwxyz0123456789")}`;
    case "stellar":
      return `G${rng.nextString(55, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")}`;
    default:
      // bitcoin-like base58 covers bitcoin, and is a plausible shape for the rest
      return genBitcoinAddressLike(rng);
  }
}
