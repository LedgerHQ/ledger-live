import type { CosmosAccount } from "@ledgerhq/coin-cosmos/types/index";

export function getVotesCount(account: CosmosAccount): number {
  return account.cosmosResources.delegations.length;
}
