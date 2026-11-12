import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";

const MAX_U64 = new BigNumber(2).pow(64).minus(1);

/** A CCD or PLT amount in its smallest unit: a non-negative u64; anything else is unreadable. */
export function parseU64Amount(value: unknown): BigNumber | undefined {
  const parsed = parseFiniteBigNumber(value);
  return parsed?.isInteger() && !parsed.isNegative() && parsed.lte(MAX_U64) ? parsed : undefined;
}
