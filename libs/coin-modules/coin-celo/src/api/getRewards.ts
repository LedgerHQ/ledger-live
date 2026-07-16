import type { Cursor, Page, Reward } from "@ledgerhq/coin-module-framework/api/index";

/**
 * Celo distributes staking rewards in-protocol at each epoch by growing active
 * votes in place — there is no discrete on-chain reward-distribution event to
 * enumerate, and the deposited baseline needed to derive an amount is not
 * tracked here. The framework documents throwing "not supported" in this case.
 *
 * Rewards are still observable indirectly: an active vote's `amount` (from
 * `getStakes`) already includes accrued rewards.
 */
export const getRewards = async (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
  throw new Error(
    "celo: getRewards is not supported — Celo has no discrete on-chain reward events " +
      "(rewards accrue in-protocol per epoch)",
  );
};

export default getRewards;
