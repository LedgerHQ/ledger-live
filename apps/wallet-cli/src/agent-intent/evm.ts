import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const DECIMAL_RE = /^(\d+)(?:\.(\d+))?$/;
const UINT256_MAX = (1n << 256n) - 1n;

/** EIP-55 mixed-case checksum encoding of a 40-hex-char address (with or without `0x`). */
export function toChecksumAddress(address: string): string {
  const lower = address.toLowerCase().replace(/^0x/, "");
  const hash = bytesToHex(keccak_256(utf8ToBytes(lower)));
  let out = "0x";
  for (let i = 0; i < lower.length; i++) {
    out += parseInt(hash[i], 16) >= 8 ? lower[i].toUpperCase() : lower[i];
  }
  return out;
}

/**
 * Validates an EVM address and returns it in checksummed form. Single-case input (all-lowercase or
 * all-uppercase) carries no checksum to verify and is accepted; mixed-case input must match EIP-55,
 * so a single mistyped character in a copied address is caught instead of proposed.
 */
export function parseEvmAddress(value: string, flag: string): string {
  if (!ADDRESS_RE.test(value)) {
    throw new Error(
      `--${flag} "${value}" is not an EVM address (expected 0x followed by 40 hex characters).`,
    );
  }
  const checksummed = toChecksumAddress(value);
  const body = value.slice(2);
  const isSingleCase = body === body.toLowerCase() || body === body.toUpperCase();
  if (!isSingleCase && value !== checksummed) {
    throw new Error(
      `--${flag} "${value}" has an invalid EIP-55 checksum — it may contain a typo. Double-check the ` +
        "address, or pass it in all-lowercase to skip checksum verification.",
    );
  }
  return checksummed;
}

/**
 * Converts a human decimal amount (e.g. "0.01") to an exact base-unit integer for a token with
 * `decimals` decimal places. Never rounds: more fractional digits than the asset supports is an
 * error, as are zero and anything above uint256.
 */
export function parseDecimalAmount(text: string, decimals: number, ticker: string): bigint {
  const match = DECIMAL_RE.exec(text);
  if (!match) {
    throw new Error(`Amount "${text}" is not a plain decimal number (e.g. 0.01 or 25).`);
  }
  const [, whole, fraction = ""] = match;
  if (fraction.length > decimals) {
    throw new Error(
      `Amount "${text}" has ${fraction.length} decimal places, but ${ticker} supports at most ${decimals}.`,
    );
  }
  const value = BigInt(whole + fraction.padEnd(decimals, "0"));
  if (value === 0n) {
    throw new Error("Amount must be greater than zero.");
  }
  if (value > UINT256_MAX) {
    throw new Error(`Amount "${text}" ${ticker} is too large to represent on-chain.`);
  }
  return value;
}

/** Splits `--amount` ("0.01 ETH" or "ETH 0.01") into its decimal part and ticker. */
export function parseAmountWithTicker(input: string): { amount: string; ticker: string } {
  const parts = input.trim().split(/\s+/);
  const isNumber = (part: string) => DECIMAL_RE.test(part);
  if (parts.length === 2 && isNumber(parts[0]) !== isNumber(parts[1])) {
    const [amount, ticker] = isNumber(parts[0]) ? parts : [parts[1], parts[0]];
    return { amount, ticker };
  }
  throw new Error(
    `--amount "${input}" must be an amount and a ticker, e.g. '0.01 ETH' or '25 USDC'.`,
  );
}
