import BigNumber from "bignumber.js";
import {
  type AccountBalance,
  type AccountBalancesResult,
  clampLocked,
} from "@ledgerhq/ledger-wallet-framework/account/balances";
import type { BtcOperationExtra, ZcashAccount } from "../types/bridge";
import { getReservedNullifiers } from "./note-reservation";
import { getTransparentBalance } from "../logic/account/balance";
import { getSpendableIronwoodBalance } from "../logic/account/spendability";

const TRANSPARENT_POOL = "transparent";
const IRONWOOD_POOL = "ironwood";

/** Outpoints, as `hash-outputIndex`, that the pending operations already spend. */
function pendingSpentOutpoints(account: ZcashAccount): Set<string> {
  const spent = new Set<string>();
  for (const { extra } of account.pendingOperations ?? []) {
    if (extra === null || typeof extra !== "object") continue;
    const refs = (extra as BtcOperationExtra).inputRefs;
    if (!Array.isArray(refs)) continue;
    for (const ref of refs) spent.add(`${ref.hash}-${ref.outputIndex}`);
  }
  return spent;
}

/**
 * The account balance as a transparent row and, when shielded is enabled, an Ironwood row.
 * Orchard and Sapling notes are not emitted: the account balance does not count them either.
 */
export function makeZcashAccountBalances(
  isShieldedEnabled: () => boolean,
): (account: ZcashAccount) => AccountBalancesResult {
  return account => {
    const utxos = account.bitcoinResources?.utxos ?? [];
    const transparent = getTransparentBalance(utxos);
    const spentOutpoints = pendingSpentOutpoints(account);
    const transparentLocked = getTransparentBalance(
      utxos.filter(utxo => spentOutpoints.has(`${utxo.hash}-${utxo.outputIndex}`)),
    );

    const rows: AccountBalance[] = [
      {
        value: transparent,
        locked: clampLocked(transparent, transparentLocked),
        pool: TRANSPARENT_POOL,
      },
    ];

    if (isShieldedEnabled()) {
      // The same figure the account balance added on top of the transparent funds.
      const ironwood = BigNumber.max(account.balance.minus(transparent), 0);
      const spendable = getSpendableIronwoodBalance(account, getReservedNullifiers(account));
      rows.push({
        value: ironwood,
        locked: clampLocked(ironwood, ironwood.minus(spendable)),
        pool: IRONWOOD_POOL,
        private: true,
      });
    }

    return { account: rows };
  };
}
