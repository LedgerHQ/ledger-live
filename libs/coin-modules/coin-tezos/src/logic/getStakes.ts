import type { Cursor, Page, Stake } from "@ledgerhq/coin-module-framework/api/types";
import { log } from "@ledgerhq/logs";
import api from "../network/tzkt";
import type { APIAccount, APIUnstakeRequest } from "../network/types";

type APIUserAccount = Extract<APIAccount, { type: "user" }>;

const STAKING_UID_PREFIX = {
  delegation: "delegation-",
  stake: "stake-",
  unstaking: "unstaking-",
  finalizable: "finalizable-",
} as const;

export const isDelegationPosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.delegation);
export const isStakePosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.stake);
export const isUnstakingPosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.unstaking);
export const isFinalizablePosition = (uid: string) =>
  uid.startsWith(STAKING_UID_PREFIX.finalizable);

export async function fetchUnstakeRequests(
  address: string,
  needed: boolean,
): Promise<APIUnstakeRequest[]> {
  return needed ? api.getUnstakeRequests(address) : [];
}

/**
 * Builds Paris-upgrade staking positions: `delegation-*`, `stake-*`, `unstaking-{id}`,
 * `finalizable-{id}`. The `delegate` on each unstake position is the baker at the time
 * the request was opened — may differ from the current delegate after a baker change.
 * Delegation/stake positions share the account's current baker (Tezos protocol invariant:
 * staked and non-staked balance are always with the same baker).
 */
export function buildStakesForAccount(
  address: string,
  account: APIUserAccount,
  unstakeRequests: APIUnstakeRequest[],
): Stake[] {
  const balance = BigInt(account.balance ?? 0);
  const stakedBalance = BigInt(account.stakedBalance ?? 0);
  const delegateAddress = account.delegate?.address;

  const stakes: Stake[] = [];

  if (delegateAddress) {
    if (balance < stakedBalance) {
      log("coin:tezos", "buildStakesForAccount: balance < stakedBalance, clamping to 0", {
        address,
        balance: balance.toString(),
        stakedBalance: stakedBalance.toString(),
      });
    }
    stakes.push({
      uid: `${STAKING_UID_PREFIX.delegation}${address}`,
      address,
      delegate: delegateAddress,
      state: "active",
      asset: { type: "native" },
      amount: balance > stakedBalance ? balance - stakedBalance : 0n,
      actions: [],
    });
  }

  if (stakedBalance > 0n) {
    stakes.push({
      uid: `${STAKING_UID_PREFIX.stake}${address}`,
      address,
      ...(delegateAddress && { delegate: delegateAddress }),
      state: "active",
      asset: { type: "native" },
      amount: stakedBalance,
      actions: [],
    });
  }

  for (const req of unstakeRequests) {
    if (req.actualAmount <= 0) {
      log("coin:tezos", "buildStakesForAccount: dropping non-positive unstake request", {
        requestId: req.id,
        actualAmount: req.actualAmount,
      });
      continue;
    }
    const createdAt = new Date(req.firstTime);
    if (!Number.isFinite(createdAt.getTime())) {
      log("coin:tezos", "buildStakesForAccount: dropping unstake request with invalid firstTime", {
        requestId: req.id,
        firstTime: req.firstTime,
      });
      continue;
    }
    const isFinalizable = req.status === "finalizable";
    const prefix = isFinalizable ? STAKING_UID_PREFIX.finalizable : STAKING_UID_PREFIX.unstaking;
    stakes.push({
      uid: `${prefix}${req.id}`,
      address,
      ...(req.baker?.address && { delegate: req.baker.address }),
      state: isFinalizable ? "inactive" : "deactivating",
      createdAt,
      asset: { type: "native" },
      amount: BigInt(req.actualAmount),
      actions: [],
    });
  }

  return stakes;
}

export async function getStakes(address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  const accountInfo = await api.getAccountByAddress(address);
  if (accountInfo.type !== "user") return { items: [] };
  const unstakeRequests = await fetchUnstakeRequests(
    address,
    (accountInfo.unstakedBalance ?? 0) > 0,
  );
  return { items: buildStakesForAccount(address, accountInfo, unstakeRequests) };
}
