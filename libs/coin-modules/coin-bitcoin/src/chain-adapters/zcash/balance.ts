import { BigNumber } from "bignumber.js";
import type { BitcoinOutput } from "../../types";
import type { ZcashPrivateInfo } from "./types";

type PrivateBalances = Pick<
  ZcashPrivateInfo,
  "orchardBalance" | "saplingBalance" | "ironwoodBalance"
>;

/**
 * Transparent balance = sum of the account's unspent transparent UTXOs.
 *
 * This is kept independent from `account.balance` (which now holds the
 * transparent + private total) so the two syncs can recompute the total
 * without double-counting the shielded funds.
 */
export function getTransparentBalance(
  utxos: Pick<BitcoinOutput, "value">[] | undefined,
): BigNumber {
  return (utxos ?? []).reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));
}

/**
 * Private (shielded) balance = the Ironwood pool only.
 *
 * Ironwood is the only shielded pool that can be spent from the send flow; the
 * Orchard and Sapling pools are deprecated and their send flows are gone. They
 * are deliberately excluded so this value matches the spendable "Private
 * balance" shown in the send modal (see ZcashTransferFromSelector) instead of
 * exceeding it by any residual Orchard/Sapling notes.
 */
export function getPrivateBalance(privateInfo: PrivateBalances | undefined | null): BigNumber {
  if (!privateInfo) return new BigNumber(0);
  return privateInfo.ironwoodBalance ?? new BigNumber(0);
}

/** Total balance shown to the user = transparent + private. */
export function computeZcashBalance(
  transparentBalance: BigNumber,
  privateInfo: PrivateBalances | undefined | null,
): BigNumber {
  return transparentBalance.plus(getPrivateBalance(privateInfo));
}
