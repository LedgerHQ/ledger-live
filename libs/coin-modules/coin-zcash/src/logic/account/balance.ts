import { BigNumber } from "bignumber.js";
import type { BitcoinOutput } from "../../types/bridge";
import type { ZcashPrivateInfo } from "../../network/types";

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
 * Private (shielded) balance = the whole Ironwood pool, mature and immature
 * notes alike.
 *
 * Ironwood is the only shielded pool that can be spent from the send flow; the
 * Orchard and Sapling pools are deprecated and their send flows are gone. They
 * are deliberately excluded so this value stays close to the account's
 * spendable Private funds, without exceeding them by any residual
 * Orchard/Sapling notes.
 *
 * This is the account's **total** private balance, not what the send modal
 * offers as spendable -- a note fresh enough to still be maturing counts here
 * but is excluded from selection (see `getSpendableIronwoodBalance` in
 * `logic/account/spendability`), which is the figure the send flow shows as
 * spendable.
 *
 * Operations are not restricted the same way: they carry the real amount moved
 * in every pool (see `convertShieldedTransactionsToOperations`), so for an
 * account holding such notes they do not sum to this balance.
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
