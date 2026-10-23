import { base58check } from "../encoding";
import { balanceRow } from "../kinds/balance";
import { randomAmount, randomBytes, type Random } from "../random";
import type { MockFamily } from "./types";

const XPUB_VERSION = [0x04, 0x88, 0xb2, 0x1e];
const TPUB_VERSION = [0x04, 0x35, 0x87, 0xcf];
const HARDENED = 0x80000000;

/** The secp256k1 field prime. */
const P = 2n ** 256n - 2n ** 32n - 977n;

/** Native segwit networks; the others of the family (dogecoin, bitcoin_cash…) use BIP44. */
const SEGWIT = new Set(["bitcoin", "bitcoin_testnet", "litecoin"]);

function modPow(base: bigint, exponent: bigint): bigint {
  let result = 1n;
  for (let b = base % P, e = exponent; e > 0n; e >>= 1n, b = (b * b) % P) {
    if (e & 1n) result = (result * b) % P;
  }
  return result;
}

/** Whether `x` is the abscissa of a secp256k1 point: x³ + 7 is a square mod p (Euler's criterion). */
function onCurve(x: bigint): boolean {
  return x < P && modPow(x ** 3n + 7n, (P - 1n) / 2n) === 1n;
}

/** A compressed public key of seeded bytes, drawn again until on the curve (one draw in two). */
function publicKey(random: Random): number[] {
  for (;;) {
    const x = randomBytes(random, 32);
    if (onCurve(x.reduce((acc, byte) => acc * 256n + BigInt(byte), 0n))) {
      return [random() < 0.5 ? 0x02 : 0x03, ...x];
    }
  }
}

/** A BIP32 account-level extended public key: depth 3, made of seeded bytes, valid checksum and point. */
function xpub(testnet: boolean, index: number, random: Random): string {
  const child = (HARDENED + index) >>> 0;
  return base58check(
    Uint8Array.from([
      ...(testnet ? TPUB_VERSION : XPUB_VERSION),
      3,
      ...randomBytes(random, 4),
      child >>> 24,
      (child >>> 16) & 0xff,
      (child >>> 8) & 0xff,
      child & 0xff,
      ...randomBytes(random, 32),
      ...publicKey(random),
    ]),
  );
}

/** UTXO accounts at the account level of the path; balances are all spendable, one account in six empty. */
export const bitcoin: MockFamily = {
  descriptor: (currency, index, random) => ({
    purpose: "mock",
    version: "2",
    type: "utxo",
    network: currency.id,
    xpub: xpub(currency.isTestnetFor !== undefined, index, random),
    path: `m/${SEGWIT.has(currency.id) ? 84 : 44}h/${currency.coinType}h/${index}h`,
  }),
  read: {
    balance: ({ currency, random }) => {
      const amount =
        random() < 1 / 6 ? 0n : randomAmount(random, currency.units[0].magnitude, 0.0005, 2);
      return [balanceRow(currency.id, amount)];
    },
  },
};
