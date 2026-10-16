import { CosmosAPI } from "../../network/Cosmos";
import { CosmosRedelegation } from "../../types";

/**
 * A redelegation (source + destination validator) can't be modelled as a single getBalance `Stake`,
 * so it's fetched here for the `enrichStakingResources` hook — executed plus, on epoched chains, the
 * queued x/epoching ones. Returns the neutral `CosmosRedelegation` (structurally a
 * `StakingRedelegation`) so the logic layer stays free of `@ledgerhq/types-live`.
 *
 * `api` is the caller's per-chain API when it has one (the coin module's, built from its context's
 * config); otherwise one is built for `currencyId`.
 */
export async function getRedelegations(
  currencyId: string,
  denom: string,
  address: string,
  api: CosmosAPI = new CosmosAPI(currencyId),
): Promise<CosmosRedelegation[]> {
  return api.getRedelegationsWithQueued(address, denom);
}
