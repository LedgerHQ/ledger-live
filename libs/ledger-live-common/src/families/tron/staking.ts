import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { AccountStakingSchema, type AccountStaking } from "@domain/entity-account-staking";
import { sumOf } from "../../account/balanceLocks";
import { isTronAccount, type UnFrozenInfo } from "./types";

/** One TRON POWER, the weight of one vote, is one frozen TRX. */
const SUN_PER_VOTE = 1_000_000;

/**
 * Votes as active positions on their super representative, their power in sun; frozen TRX backing no
 * vote as one inactive position; unfreezing TRX as unlocking ones; the reward account-wide.
 */
export default function tronStaking(account: Account): AccountStaking {
  if (!isTronAccount(account)) return { positions: [] };
  const assetId = account.currency.id;
  const { frozen, delegatedFrozen, legacyFrozen, unFrozen, votes, unwithdrawnReward } =
    account.tronResources;
  const voted = votes.map(({ address, voteCount }) => ({
    id: `vote:${address}`,
    assetId,
    validatorId: address,
    state: "active",
    amount: new BigNumber(voteCount).times(SUN_PER_VOTE).toFixed(0),
    votes: String(voteCount),
  }));
  const frozenTotal = sumOf([
    frozen.bandwidth?.amount,
    frozen.energy?.amount,
    delegatedFrozen.bandwidth?.amount,
    delegatedFrozen.energy?.amount,
    legacyFrozen.bandwidth?.amount,
    legacyFrozen.energy?.amount,
  ]);
  const unvoted = BigNumber.max(
    0,
    frozenTotal.minus(votes.reduce((sum, { voteCount }) => sum + voteCount, 0) * SUN_PER_VOTE),
  );
  const now = Date.now();
  const unfreezing = (resource: string, entries: UnFrozenInfo[] | null | undefined) =>
    (entries ?? []).map(({ amount, expireTime }, index) => ({
      id: `unfreezing:${resource}:${expireTime.getTime()}:${index}`,
      assetId,
      state: expireTime.getTime() > now ? "deactivating" : "withdrawable",
      amount: amount.toFixed(0),
      unlockAt: expireTime.toISOString(),
    }));
  return AccountStakingSchema.parse({
    positions: [
      ...voted,
      ...(unvoted.gt(0)
        ? [{ id: "frozen", assetId, state: "inactive", amount: unvoted.toFixed(0) }]
        : []),
      ...unfreezing("bandwidth", unFrozen.bandwidth),
      ...unfreezing("energy", unFrozen.energy),
    ],
    rewards: unwithdrawnReward.gt(0)
      ? [{ assetId, amount: unwithdrawnReward.toFixed(0) }]
      : undefined,
  });
}
