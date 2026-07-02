import type {
  AssetInfo,
  Cursor,
  Page,
  Stake,
  StakeState,
} from "@ledgerhq/coin-module-framework/api/index";
import { getPendingWithdrawals, getVotes } from "../network/sdk";

const NATIVE: AssetInfo = { type: "native" };

/**
 * Returns the account's Celo staking positions, mapped to framework `Stake`s:
 *
 * - **Votes** (`getVotes`) — one Stake per (group, pending|active) position.
 *   `delegate` = the validator group; `state` is `activating` for pending votes
 *   and `active` for active ones; `undelegate` (revoke) is the available action.
 *   Celo has no framework `StakeAction` for "activate", so activation readiness
 *   is surfaced in `details` for the caller to drive.
 * - **Pending withdrawals** (`getPendingWithdrawals`) — one Stake per unbonding
 *   entry; `withdrawable` once its timer elapsed (action `withdraw`), else
 *   `deactivating` (no action yet).
 *
 * All positions are returned in a single page. Non-voting locked balance is not
 * represented as a Stake yet (see `src/api/STAKING.md`).
 */
export const getStakes = async (address: string, _cursor?: Cursor): Promise<Page<Stake>> => {
  const [votes, pendingWithdrawals] = await Promise.all([
    getVotes(address),
    getPendingWithdrawals(address).catch(() => []),
  ]);

  const voteStakes: Stake[] = votes.map(vote => ({
    uid: `${address}:${vote.validatorGroup}:${vote.type}`,
    address,
    delegate: vote.validatorGroup,
    state: vote.type === "active" ? "active" : "activating",
    actions: ["undelegate"],
    asset: NATIVE,
    amount: BigInt(vote.amount.toFixed(0)),
    details: {
      voteType: vote.type,
      index: vote.index,
      activatable: vote.activatable,
      revokable: vote.revokable,
    },
  }));

  const nowSeconds = Math.floor(Date.now() / 1000);
  const withdrawalStakes: Stake[] = pendingWithdrawals.map(withdrawal => {
    const matured = withdrawal.time.lte(nowSeconds);
    const state: StakeState = matured ? "withdrawable" : "deactivating";
    return {
      uid: `${address}:withdrawal:${withdrawal.index}`,
      address,
      state,
      actions: matured ? ["withdraw"] : [],
      asset: NATIVE,
      amount: BigInt(withdrawal.value.toFixed(0)),
      details: { index: withdrawal.index, availableAt: withdrawal.time.toNumber() },
    };
  });

  return { items: [...voteStakes, ...withdrawalStakes], next: undefined };
};

export default getStakes;
