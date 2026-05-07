import type { Cursor, Page, Stake } from "@ledgerhq/coin-module-framework/api/types";
import api from "../network/tzkt";
import type { APIAccount } from "../network/types";

type APIUserAccount = Extract<APIAccount, { type: "user" }>;

/**
 * Build the staking positions exposed by a Tezos account, per Paris upgrade semantics:
 * - delegation position (when a delegate is set) for the non-staked, delegated amount
 * - active staking position (when `stakedBalance > 0`)
 * - deactivating unstake position (still in the unlock-cycle delay)
 * - finalizable unstake position (delay elapsed; ready for `finalize_unstake`)
 *
 * `account.unstakedBalance` (per TzKT) is the SUPERSET of pending + finalizable unstakes.
 * `finalizable` is queried separately (see `api.getUnstakeRequestsFinalizable`); the
 * `unstaking-*` position carries the still-locked remainder. Clamping guards against the
 * non-transactional gap between the two TzKT calls (a `finalize_unstake` landing in
 * between could otherwise drive `unstakedBalance - finalizable` negative).
 *
 * Each entry inherits the account `delegate` when set, since on Tezos a staked or unstaked
 * portion is necessarily delegated to the same baker as the rest of the balance.
 */
export function buildStakesForAccount(
  address: string,
  account: APIUserAccount,
  finalizable: bigint,
): Stake[] {
  const balance = BigInt(account.balance ?? 0);
  const stakedBalance = BigInt(account.stakedBalance ?? 0);
  const unstakedTotal = BigInt(account.unstakedBalance ?? 0);
  const finalizableAmount = finalizable < unstakedTotal ? finalizable : unstakedTotal;
  const stillDeactivating = unstakedTotal - finalizableAmount;
  const delegateAddress = account.delegate?.address;

  const stakes: Stake[] = [];

  if (delegateAddress) {
    stakes.push({
      uid: `delegation-${address}`,
      address,
      delegate: delegateAddress,
      state: "active",
      asset: { type: "native" },
      amount: balance - stakedBalance,
    });
  }

  if (stakedBalance > 0n) {
    stakes.push({
      uid: `stake-${address}`,
      address,
      ...(delegateAddress && { delegate: delegateAddress }),
      state: "active",
      asset: { type: "native" },
      amount: stakedBalance,
    });
  }

  if (stillDeactivating > 0n) {
    stakes.push({
      uid: `unstaking-${address}`,
      address,
      ...(delegateAddress && { delegate: delegateAddress }),
      state: "deactivating",
      asset: { type: "native" },
      amount: stillDeactivating,
    });
  }

  if (finalizableAmount > 0n) {
    stakes.push({
      uid: `finalizable-${address}`,
      address,
      ...(delegateAddress && { delegate: delegateAddress }),
      state: "inactive",
      asset: { type: "native" },
      amount: finalizableAmount,
    });
  }

  return stakes;
}

export async function getStakes(address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  const accountInfo = await api.getAccountByAddress(address);
  if (accountInfo.type !== "user") return { items: [] };
  const finalizable =
    (accountInfo.unstakedBalance ?? 0) > 0 ? await api.getUnstakeRequestsFinalizable(address) : 0n;
  return { items: buildStakesForAccount(address, accountInfo, finalizable) };
}
