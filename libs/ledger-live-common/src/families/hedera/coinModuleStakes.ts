import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CoinModuleStakesNormalization } from "../../coin-modules/types";

/** `getStakes` names the node by its account address, `getValidators` keys it by its node id. */
const delegateOf = ({ delegate, details }: Stake): string | undefined =>
  delegate && typeof details?.stakedNodeId === "number" ? String(details.stakedNodeId) : delegate;

/** `getStakes` adds the pending reward to `amount`: it is not paid into the balance yet, so the position keeps its principal and the reward stays apart. */
const normalizeStake = (stake: Stake): Stake => {
  const delegate = delegateOf(stake);
  return {
    ...stake,
    ...(delegate === undefined ? {} : { delegate }),
    ...(stake.amountDeposited === undefined ? {} : { amount: stake.amountDeposited }),
  };
};

const hederaCoinModuleStakes: CoinModuleStakesNormalization = { normalizeStake };

export default hederaCoinModuleStakes;
