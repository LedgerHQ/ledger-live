import type {
  AssetInfo,
  Cursor,
  Page,
  Stake,
  StakeAction,
} from "@ledgerhq/coin-module-framework/api/types";
import type { BigNumber } from "bignumber.js";
import type { TronCoinConfig } from "../config";
import { fetchTronAccount } from "../network";
import type { TronResources, UnFrozenInfo } from "../types";
import { ONE_TRX, REWARD_WITHDRAW_COOLDOWN_MS } from "./constants";
import { fetchTronResources } from "./tronResources";

const NATIVE: AssetInfo = { type: "native" };
const SUN_PER_TRX = BigInt(ONE_TRX.toFixed(0));

/**
 * The account's Tron staking positions as framework {@link Stake}s.
 *
 * Tron stakes at two overlapping layers: TRX is frozen for account-wide Tron Power, and that power is
 * then voted to super representatives. Emitting a position for each layer would count the same TRX
 * twice for a caller summing `amount`, so the frozen layer is split against the votes instead — one
 * stake per vote, plus one for whatever Tron Power is not voted. Summed, the positions are exactly the
 * account's staked TRX plus its pending reward.
 *
 * Unlike Celo, whose non-voting locked balance is not represented, the unvoted remainder is emitted:
 * on Tron it still earns bandwidth and energy, so it is a live position rather than idle balance.
 *
 * The whole set is one page — the account payload carries every position — so a cursor is meaningless
 * and rejected rather than silently ignored, which would loop a paginating caller forever.
 */
export async function getStakes(
  config: TronCoinConfig,
  address: string,
  cursor?: Cursor,
): Promise<Page<Stake>> {
  if (cursor !== undefined) {
    throw new Error(
      "getStakes does not paginate for Tron: every position is in the account payload",
    );
  }

  const accounts = await fetchTronAccount(config, address);
  // An address with no on-chain account has nothing frozen, and `fetchTronResources` would fetch
  // network info for an address the node does not know.
  if (accounts.length === 0) return { items: [] };

  return { items: buildTronStakes(address, await fetchTronResources(config, accounts[0])) };
}

/**
 * Shares `fetchTronResources` with the family account-shape hook, so the Coin Module API and the
 * staking screens describe the same positions from the same numbers.
 *
 * `now` is a parameter because two of the three position kinds depend on the clock — an unfreezing
 * entry becomes withdrawable, and a claimed reward locks for 24h.
 */
export function buildTronStakes(
  address: string,
  resources: TronResources,
  now: Date = new Date(),
): Stake[] {
  const rewardTotal = toSun(resources.unwithdrawnReward);
  const claimable = isRewardClaimable(resources, rewardTotal, now);
  const voteCounts = resources.votes.map(vote => BigInt(vote.voteCount) * SUN_PER_TRX);
  const rewardShares = splitPerVote(rewardTotal, voteCounts);

  const voteStakes: Stake[] = resources.votes.map((vote, index) => {
    const deposited = voteCounts[index];
    const rewarded = rewardShares[index];
    return {
      uid: `${address}:vote:${vote.address}`,
      address,
      delegate: vote.address,
      state: "active",
      // A Tron vote is replaced wholesale by the next `VoteWitnessContract`, which is what
      // `redelegate` describes; `undelegate` is the unfreeze that takes the Tron Power back.
      actions: claimable
        ? (["redelegate", "undelegate", "claim_reward"] as StakeAction[])
        : (["redelegate", "undelegate"] as StakeAction[]),
      // No `stateUpdatedAt`: TronGrid reports no last-vote timestamp on the account payload.
      asset: NATIVE,
      amount: deposited + rewarded,
      amountDeposited: deposited,
      amountRewarded: rewarded,
      details: {
        voteCount: vote.voteCount,
        ...(vote.name ? { validatorName: vote.name } : {}),
      },
    };
  });

  const unvoted = frozenSun(resources) - voteCounts.reduce((total, count) => total + count, 0n);
  // Whatever the per-vote split left unassigned — the *entire* reward once an account has unvoted,
  // since Tron keeps paying out `unwithdrawnReward` until it is withdrawn. Carried here so the
  // positions still sum to the account's staked TRX plus its pending reward.
  const unvotedRewarded = rewardTotal - rewardShares.reduce((total, share) => total + share, 0n);
  const unvotedStake: Stake[] =
    unvoted > 0n || unvotedRewarded > 0n
      ? [
          {
            uid: `${address}:unvoted`,
            address,
            // Frozen and earning resources, but backing no super representative, so it accrues
            // nothing further — `inactive` is the state that says so without claiming it is unstaked.
            state: "inactive",
            actions:
              claimable && unvotedRewarded > 0n
                ? (["delegate", "undelegate", "claim_reward"] as StakeAction[])
                : (["delegate", "undelegate"] as StakeAction[]),
            asset: NATIVE,
            amount: unvoted + unvotedRewarded,
            amountDeposited: unvoted,
            amountRewarded: unvotedRewarded,
            details: { voteCount: 0 },
          },
        ]
      : [];

  const unfreezingStakes: Stake[] = unfreezingEntries(resources).map(({ resource, entry }) => {
    const withdrawable = entry.expireTime.getTime() <= now.getTime();
    const amount = toSun(entry.amount);
    return {
      // Keyed by resource and expiry rather than array index: java-tron merges same-expiry unfreezes
      // into one entry, and an index shifts as earlier entries are withdrawn.
      uid: `${address}:unfreeze:${resource}:${entry.expireTime.getTime()}`,
      address,
      state: withdrawable ? "withdrawable" : "deactivating",
      actions: withdrawable ? ["withdraw"] : [],
      ...(withdrawable ? { stateUpdatedAt: entry.expireTime } : {}),
      asset: NATIVE,
      amount,
      amountDeposited: amount,
      amountRewarded: 0n,
      details: { resource, availableAt: entry.expireTime.toISOString() },
    };
  });

  return [...voteStakes, ...unvotedStake, ...unfreezingStakes];
}

/**
 * Every position's TRX is frozen through one of these six slots, and their sum is what `tronPower`
 * counts — including `delegatedFrozen`, since delegating a resource lends the bandwidth or energy
 * away but keeps the voting power with the owner.
 */
function frozenSun(resources: TronResources): bigint {
  const { frozen, delegatedFrozen, legacyFrozen } = resources;
  return [
    frozen.bandwidth,
    frozen.energy,
    delegatedFrozen.bandwidth,
    delegatedFrozen.energy,
    legacyFrozen.bandwidth,
    legacyFrozen.energy,
  ].reduce((total, slot) => total + toSun(slot?.amount), 0n);
}

function unfreezingEntries(
  resources: TronResources,
): Array<{ resource: "BANDWIDTH" | "ENERGY"; entry: UnFrozenInfo }> {
  return [
    ...(resources.unFrozen.bandwidth ?? []).map(entry => ({
      resource: "BANDWIDTH" as const,
      entry,
    })),
    ...(resources.unFrozen.energy ?? []).map(entry => ({ resource: "ENERGY" as const, entry })),
  ];
}

/**
 * `withdrawBalance` claims the whole accrued reward at once and then locks for 24h, so claimability
 * is an account-wide fact rather than a per-vote one. Mirrors the `claimReward` branch of
 * `validateIntent`, which is what actually rejects a premature claim.
 */
function isRewardClaimable(resources: TronResources, rewardTotal: bigint, now: Date): boolean {
  if (rewardTotal <= 0n) return false;
  const lastWithdrawn = resources.lastWithdrawnRewardDate;
  if (!lastWithdrawn) return true;
  return lastWithdrawn.getTime() + REWARD_WITHDRAW_COOLDOWN_MS <= now.getTime();
}

/**
 * Splits the accrued reward across votes by weight. Exact in total, approximate per validator: the
 * chain attributes the reward per super representative at that SR's own brokerage rate, which would
 * cost one request per SR to read. The last share absorbs the integer-division remainder so the
 * shares still sum to the reward the account will actually receive.
 */
function splitPerVote(total: bigint, voteCounts: bigint[]): bigint[] {
  const votedTotal = voteCounts.reduce((sum, count) => sum + count, 0n);
  if (total <= 0n || votedTotal <= 0n) return voteCounts.map(() => 0n);

  let assigned = 0n;
  return voteCounts.map((count, index) => {
    if (index === voteCounts.length - 1) return total - assigned;
    const share = (total * count) / votedTotal;
    assigned += share;
    return share;
  });
}

const toSun = (amount: BigNumber | null | undefined): bigint =>
  amount ? BigInt(amount.integerValue().toFixed(0)) : 0n;
