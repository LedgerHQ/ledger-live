import Prando from "prando";
import type { CryptoCurrency, TokenCurrency } from "../types";
import { getCurrenciesResolver } from "../currencies/resolver";

/**
 * @memberof mock/account
 */
const base58Charset = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const base58Encode = (value: bigint): string => {
  let out = "";
  for (let n = value; n > 0n; n /= 58n) out = base58Charset[Number(n % 58n)] + out;
  return out;
};

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

const ed25519P = (1n << 255n) - 19n;
// 2^255 - 19 is the curve25519 field; `d` is its curve constant.
const ed25519D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
const ed25519SignMask = (1n << 255n) - 1n;

function modPow(base: bigint, exponent: bigint, modulo: bigint): bigint {
  let result = 1n;
  let b = base % modulo;
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulo;
    b = (b * b) % modulo;
    e >>= 1n;
  }
  return result;
}

/**
 * True when y is a valid y-coordinate on ed25519, i.e. x² = (y² − 1) / (dy² + 1) has a square root.
 * @memberof mock/account
 */
export function isEd25519CurvePoint(y: bigint): boolean {
  const y2 = (y * y) % ed25519P;
  const u = (y2 - 1n + ed25519P) % ed25519P;
  const v = (ed25519D * y2 + 1n) % ed25519P;
  const v3 = (((v * v) % ed25519P) * v) % ed25519P;
  const v7 = (((v3 * v3) % ed25519P) * v) % ed25519P;
  const x =
    (((u * v3) % ed25519P) * modPow((u * v7) % ed25519P, (ed25519P - 5n) / 8n, ed25519P)) %
    ed25519P;
  const vx2 = (((v * x) % ed25519P) * x) % ed25519P;
  return vx2 === u || vx2 === ed25519P - u;
}

/** Swap the byte order of a hex string; ed25519 keys are serialized little-endian. */
function reverseHexBytes(hex: string): string {
  return hex.match(/../g)!.reverse().join("");
}

/**
 * A 32-byte compressed ed25519 public key, the shape concordium's proxy decodes. The proxy reads
 * the bytes little-endian (RFC 8032) and rejects about half of random strings, so decode the
 * candidate the same way and walk y until the curve equation holds. The x parity bit stays 0,
 * which always decodes. Consumes the same single rng draw as a plain 64-hex xpub, so other
 * generators stay aligned.
 * @memberof mock/account
 */
export function genEd25519PublicKey(rng: Prando): string {
  const littleEndian = BigInt(`0x${reverseHexBytes(genHex(64, rng))}`);
  let y = (littleEndian & ed25519SignMask) % ed25519P;
  for (let i = 0; i < 64 && !isEd25519CurvePoint(y); i++) {
    y = (y + 1n) % ed25519P;
  }
  return reverseHexBytes(y.toString(16).toUpperCase().padStart(64, "0"));
}

const bech32Charset = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const bech32mConstant = 0x2bc830a3;

function bech32Polymod(values: number[]): number {
  const generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let checksum = 1;
  for (const value of values) {
    const top = checksum >> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) checksum ^= generator[i];
    }
  }
  return checksum;
}

function bech32mChecksum(hrp: string, data: number[]): string {
  const hrpValues = [...hrp].map(char => char.charCodeAt(0) >> 5);
  const hrpSeparator = [...hrp].map(char => char.charCodeAt(0) & 31);
  const polymod = bech32Polymod([...hrpValues, 0, ...hrpSeparator, ...data, 0, 0, 0, 0, 0, 0]);
  const checksum = polymod ^ bech32mConstant;
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += bech32Charset[(checksum >> (5 * (5 - i))) & 31];
  }
  return out;
}

/**
 * Generates a valid bech32m address (e.g. aleo) from random bytes.
 * @memberof mock/account
 */
export function genBech32mAddress(hrp: string, byteLength: number, rng: Prando): string {
  const hex = genHex(byteLength * 2, rng);
  const data: number[] = [];
  let accumulator = 0;
  let bits = 0;
  for (let i = 0; i < hex.length; i += 2) {
    accumulator = (accumulator << 8) | parseInt(hex.slice(i, i + 2), 16);
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      data.push((accumulator >> bits) & 31);
    }
  }
  if (bits > 0) data.push((accumulator << (5 - bits)) & 31);
  return `${hrp}1${data.map(value => bech32Charset[value]).join("")}${bech32mChecksum(hrp, data)}`;
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
      return genBech32mAddress("aleo", 32, rng);
    case "celo": // evm-compatible chain whose validator wants a lowercase hex address
      return `0x${genHex(40, rng).toLowerCase()}`;
    case "vechain": // evm-compatible chain that lives in its own family
      return `0x${genHex(40, rng)}`;
    case "filecoin":
      // the f1 checksum is blake2b-4, so pin a known-valid fixture address;
      // this one has a single tx, so paging the explorer stays fast
      return "f1plmg3kklvmnodfboimcq5w27mnfs2hwjtas6gia";
    case "stacks":
      // the c32 checksum is blake2b-4, so pin a known-valid fixture address;
      // the boot address SP000000000000000000002Q6VF78 has 17k txs, this one 21
      return "SP3H6RCZ1X6V85NZBDVCBPGQ1CGBJKY9WYHBKFYBA";
    case "sui":
      return `0x${genHex(64, rng)}`;
    case "ton":
      // raw workchain:hash form, accepted by @ton/core Address.parse
      return `0:${genHex(64, rng)}`;
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
      return currency.id === "hedera_testnet"
        ? "0.0.1234567" // exists on the testnet mirror node with only 2 txs, so sync is quick
        : `0.0.${rng.nextInt(1000000, 9999999)}`;
    case "solana":
      // solana wants a 32-byte base58 address; forcing the top bit keeps the
      // encoding at 43-44 chars, so the leading zero byte never gets lost
      return base58Encode(BigInt(`0x${genHex(64, rng)}`) | (1n << 255n));
    case "algorand":
      return rng.nextString(58, "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567");
    default:
      // bitcoin-like base58 covers bitcoin, and is a plausible shape for the rest
      return genBitcoinAddressLike(rng);
  }
}
