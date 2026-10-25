import Prando from "prando";
import type { CryptoCurrency, TokenCurrency } from "../types";
import { getCurrenciesResolver } from "../currencies/resolver";

/**
 * @memberof mock/account
 */
const base58Charset = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * bech32 human readable prefixes of the cosmos family chains.
 * Mirrors coin-cosmos `src/chain` (which the framework does not depend on).
 * @memberof mock/account
 */
const cosmosBech32Prefix: Record<string, string> = {
  axelar: "axelar",
  babylon: "bbn",
  binance_beacon_chain: "bnb",
  coreum: "core",
  cosmos: "cosmos",
  cosmos_testnet: "cosmos",
  crypto_org: "cro",
  crypto_org_croeseid: "cro",
  desmos: "desmos",
  dydx: "dydx",
  gonka: "gonka",
  injective: "inj",
  mantra: "mantra",
  nyx: "n",
  osmo: "osmo",
  persistence: "persistence",
  secret_network: "secret",
  stargaze: "stars",
  stride: "stride",
  xion: "xion",
};

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
  const chainId = currency.type === "CryptoCurrency" ? currency.id : currency.parentCurrencyId;
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
      return `${cosmosBech32Prefix[chainId] ?? "cosmos"}1${rng.nextString(
        38,
        "abcdefghijklmnopqrstuvwxyz0123456789",
      )}`;
    case "tezos":
      return `tz1${rng.nextString(33, base58Charset)}`;
    case "tron":
      return `T${rng.nextString(33, base58Charset)}`;
    case "cardano":
      return `addr1${rng.nextString(50, "abcdefghijklmnopqrstuvwxyz0123456789")}`;
    case "stellar":
      return `G${rng.nextString(55, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")}`;
    case "hedera":
      // hedera uses shard.realm.num account ids; the sync resolves the EVM
      // address of that live account, so stay in a range that exists on mainnet
      return `0.0.${rng.nextInt(1000000, 9999999)}`;
    case "algorand":
      return rng.nextString(58, "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567");
    default:
      // bitcoin-like base58 covers bitcoin, and is a plausible shape for the rest
      return genBitcoinAddressLike(rng);
  }
}
