import { CosmosAPI } from "../../network/Cosmos";
import { CosmosRedelegation } from "../../types";

/**
 * A redelegation (source + destination validator) can't be modelled as a single getBalance `Stake`,
 * so it's fetched here for the `enrichStakingResources` hook — executed plus, on epoched chains, the
 * queued x/epoching ones. Returns the neutral `CosmosRedelegation` (structurally a
 * `StakingRedelegation`) so the logic layer stays free of `@ledgerhq/types-live`.
 */
export async function getRedelegations(
  currencyId: string,
  address: string,
): Promise<CosmosRedelegation[]> {
  const api = new CosmosAPI(currencyId);
  return api.getRedelegationsWithQueued(address, api.getCurrency());
}
