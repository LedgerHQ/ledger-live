import type { Cursor, Page, Stake } from "@ledgerhq/coin-module-framework/api/types";
import api from "../network/tzkt";
import type { APIAccount } from "../network/types";

type APIUserAccount = Extract<APIAccount, { type: "user" }>;

/**
 * Build the staking positions exposed by a Tezos account, per Paris upgrade semantics:
 * - delegation position (when a delegate is set) for the non-staked, delegated amount
 * - active staking position (when `stakedBalance > 0`)
 * - deactivating unstake position (when `unstakedBalance > 0`)
 *
 * Each entry inherits the account `delegate` when set, since on Tezos a staked or unstaked
 * portion is necessarily delegated to the same baker as the rest of the balance.
 */
export function buildStakesForAccount(address: string, account: APIUserAccount): Stake[] {
  const balance = BigInt(account.balance ?? 0);
  const stakedBalance = BigInt(account.stakedBalance ?? 0);
  const unstakedBalance = BigInt(account.unstakedBalance ?? 0);
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

  if (unstakedBalance > 0n) {
    stakes.push({
      uid: `unstaking-${address}`,
      address,
      ...(delegateAddress && { delegate: delegateAddress }),
      state: "deactivating",
      asset: { type: "native" },
      amount: unstakedBalance,
    });
  }

  return stakes;
}

export async function getStakes(address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  const accountInfo = await api.getAccountByAddress(address);
  if (accountInfo.type !== "user") return { items: [] };
  return { items: buildStakesForAccount(address, accountInfo) };
}
