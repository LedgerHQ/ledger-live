import { BigNumber } from "bignumber.js";
import type { BitcoinOutput } from "../../types";
import type { ZcashPrivateInfo } from "./types";

type PrivateBalances = Pick<ZcashPrivateInfo, "orchardBalance" | "saplingBalance">;

/**
 * Transparent balance = sum of the account's unspent transparent UTXOs.
 *
 * This is kept independent from `account.balance` (which now holds the
 * transparent + private total) so the two syncs can recompute the total
 * without double-counting the shielded funds.
 */
export function getTransparentBalance(utxos: Pick<BitcoinOutput, "value">[] | undefined): BigNumber {
  return (utxos ?? []).reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));
}

/** Private (shielded) balance = orchard + sapling. */
export function getPrivateBalance(privateInfo: PrivateBalances | undefined | null): BigNumber {
  if (!privateInfo) return new BigNumber(0);
  return (privateInfo.orchardBalance ?? new BigNumber(0)).plus(
    privateInfo.saplingBalance ?? new BigNumber(0),
  );
}

/** Total balance shown to the user = transparent + private. */
export function computeZcashBalance(
  transparentBalance: BigNumber,
  privateInfo: PrivateBalances | undefined | null,
): BigNumber {
  return transparentBalance.plus(getPrivateBalance(privateInfo));
}
