import type {
  AssetInfo,
  Stake,
  StakeAction,
  StakeState,
} from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { extractStakeKeyFromAddress } from "../utils";
import type { CardanoDelegation } from "../types";

export const NATIVE_ASSET: AssetInfo = { type: "native", name: "ADA" };

/**
 * Resolve an address's stake credential and its on-chain delegation. Addresses with no
 * stake credential (enterprise, pointer, Byron, or unparseable) skip the network call;
 * otherwise the delegation is whatever {@link getDelegationInfo} returns for the stake key.
 */
export async function fetchDelegation(
  currency: CryptoCurrency,
  address: string,
): Promise<{ stakeKey: string | undefined; delegation: CardanoDelegation | undefined }> {
  const stakeKey = extractStakeKeyFromAddress(address);
  const delegation = stakeKey ? await getDelegationInfo(currency, stakeKey) : undefined;
  return { stakeKey, delegation };
}

/**
 * Staking actions for a Cardano delegation, keyed on registration (`status`): a registered stake key can
 * re-delegate / change pool (`delegate`) or deregister to reclaim its deposit (`undelegate`); an
 * unregistered key can only `delegate` (registers + delegates in one tx). Cardano has no distinct
 * "redelegate" — changing pool is the same STAKE_DELEGATION cert, i.e. the `delegate` action — and no
 * claim_reward: rewards are withdrawn implicitly within a transaction, not as a standalone action.
 */
function computeStakeActions(delegation: CardanoDelegation): StakeAction[] {
  return delegation.status ? ["delegate", "undelegate"] : ["delegate"];
}

/**
 * Map a Cardano delegation to a framework {@link Stake}. Cardano delegation locks no
 * principal (the whole balance is delegated implicitly), so the only concrete amounts
 * are the stake-key deposit and the claimable rewards — modelled as amountDeposited /
 * amountRewarded respectively. Returns undefined when there is no staking position.
 */
export function buildStake(
  address: string,
  stakeKey: string | undefined,
  delegation: CardanoDelegation | undefined,
): Stake | undefined {
  if (!stakeKey || !delegation) return undefined;

  const rewards = delegation.rewards ?? new BigNumber(0);
  // A registered stake key (status) locks a refundable deposit and can be deregistered, so it's a
  // reportable position even with no active pool; only an unregistered key with no rewards is nothing.
  if (!delegation.status && rewards.lte(0)) return undefined;

  const amountDeposited = BigInt(new BigNumber(delegation.deposit || 0).toFixed(0));
  const amountRewarded = BigInt(rewards.toFixed(0));
  // Only active/inactive: /v1/delegation exposes no epoch-delayed "activating"/"deactivating"
  // state (would need pending-cert / epoch data, cf. LIVE-18622). Active == delegated to a pool.
  const state: StakeState = delegation.poolId ? "active" : "inactive";
  const actions = computeStakeActions(delegation);

  const details: Record<string, unknown> = {};
  if (delegation.ticker) details.ticker = delegation.ticker;
  if (delegation.name) details.name = delegation.name;
  if (delegation.dRepHex) details.dRepHex = delegation.dRepHex;

  const stake: Stake = {
    uid: stakeKey,
    address,
    state,
    asset: NATIVE_ASSET,
    // amount = the 2-ADA stake-key deposit + claimable rewards (framework `amount` is
    // deposits + rewards). Cardano staking is liquid — no principal is locked — so the
    // delegated balance itself is reported by getBalance, not here.
    amount: amountDeposited + amountRewarded,
    amountDeposited,
    amountRewarded,
    actions,
  };
  if (delegation.poolId) stake.delegate = delegation.poolId;
  if (Object.keys(details).length > 0) stake.details = details;
  return stake;
}
