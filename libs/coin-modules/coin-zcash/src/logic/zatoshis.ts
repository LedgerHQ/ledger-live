import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";

// Wider than any real amount, narrow enough that an exponent like 1e1000000 never expands.
const MAX_ZATOSHIS = new BigNumber(2).pow(128);

/** A zatoshi amount is a non-negative integer below 2^128; anything else is unreadable. */
export function parseZatoshis(value: unknown): BigNumber | undefined {
  const parsed = parseFiniteBigNumber(value);
  return parsed?.isInteger() && !parsed.isNegative() && parsed.lt(MAX_ZATOSHIS)
    ? parsed
    : undefined;
}
