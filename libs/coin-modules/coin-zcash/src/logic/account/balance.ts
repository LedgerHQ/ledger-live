import { BigNumber } from "bignumber.js";
import type { BitcoinOutput } from "../../types/bridge";
import type { ZcashPrivateInfo } from "../../network/types";
import { ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS } from "../../constants";
import { getTxType } from "../../bridge/operations";

type PrivateBalances = Pick<
  ZcashPrivateInfo,
  "orchardBalance" | "saplingBalance" | "ironwoodBalance"
>;

/**
 * Transparent balance = sum of the account's unspent transparent UTXOs.
 *
 * Kept independent from `account.balance` (which holds the transparent + private
 * total) so the two syncs can recompute the total without double-counting the
 * shielded funds.
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
 *
 * Operations are not restricted the same way: they carry the real amount moved
 * in every pool (see `convertShieldedTransactionsToOperations`), so for an
 * account holding such notes they do not sum to this balance.
 */
export function getPrivateBalance(privateInfo: PrivateBalances | undefined | null): BigNumber {
  if (!privateInfo) return new BigNumber(0);
  return privateInfo.ironwoodBalance ?? new BigNumber(0);
}

/**
 * Whether the account made an outgoing shielded transaction that has not yet
 * gained {@link ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS} confirmations.
 *
 * The change note of an outgoing shielded send is summed back into the spendable
 * Ironwood balance as soon as it is scanned, but it cannot be spent again until
 * its transaction has enough blocks mined on top of it. Confirmations are counted
 * against the latest scanned block (`lastProcessedBlock`): an outgoing transaction
 * is still maturing while `lastProcessedBlock - tx.blockHeight` is below the delay.
 * Returns true when any such transaction exists, so the send flow can warn that
 * the spendable balance may temporarily trail the total. Incoming transactions are
 * ignored — they do not gate spendability the same way.
 */
export function hasRecentlyShieldedFunds(
  privateInfo: Pick<ZcashPrivateInfo, "transactions" | "lastProcessedBlock"> | undefined | null,
): boolean {
  const transactions = privateInfo?.transactions;
  const lastProcessedBlock = privateInfo?.lastProcessedBlock;
  if (!transactions?.length || lastProcessedBlock === null || lastProcessedBlock === undefined)
    return false;
  return transactions.some(
    tx =>
      getTxType(tx).endsWith("_OUT") &&
      lastProcessedBlock - tx.blockHeight < ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
  );
}

/** Total balance shown to the user = transparent + private. */
export function computeZcashBalance(
  transparentBalance: BigNumber,
  privateInfo: PrivateBalances | undefined | null,
): BigNumber {
  return transparentBalance.plus(getPrivateBalance(privateInfo));
}
