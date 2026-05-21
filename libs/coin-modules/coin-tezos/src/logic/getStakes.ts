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

export function fetchUnstakeRequests(
  address: string,
  account: APIAccount,
): Promise<APIUnstakeRequest[]> {
  if (account.type !== "user") return Promise.resolve([]);
  return (account.unstakedBalance ?? 0) > 0
    ? api.getUnstakeRequests(address)
    : Promise.resolve([]);
}

function unstakeRequestToStake(address: string, req: APIUnstakeRequest): Stake | null {
  if (req.actualAmount <= 0) {
    log("coin:tezos", "unstakeRequestToStake: dropping non-positive unstake request", {
      requestId: req.id,
      actualAmount: req.actualAmount,
    });
    return null;
  }
  const createdAt = new Date(req.firstTime);
  if (!Number.isFinite(createdAt.getTime())) {
    log("coin:tezos", "unstakeRequestToStake: dropping unstake request with invalid firstTime", {
      requestId: req.id,
      firstTime: req.firstTime,
    });
    return null;
  }
  const isFinalizable = req.status === "finalizable";
  const prefix = isFinalizable ? STAKING_UID_PREFIX.finalizable : STAKING_UID_PREFIX.unstaking;
  return {
    uid: `${prefix}${req.id}`,
    address,
    ...(req.baker?.address && { delegate: req.baker.address }),
    state: isFinalizable ? "inactive" : "deactivating",
    createdAt,
    asset: { type: "native" },
    amount: BigInt(req.actualAmount),
    actions: [],
  };
}

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
    const stake = unstakeRequestToStake(address, req);
    if (stake) stakes.push(stake);
  }

  return stakes;
}

export async function getStakes(address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  const accountInfo = await api.getAccountByAddress(address);
  if (accountInfo.type !== "user") return { items: [] };
  const unstakeRequests = await fetchUnstakeRequests(address, accountInfo);
  return { items: buildStakesForAccount(address, accountInfo, unstakeRequests) };
}
