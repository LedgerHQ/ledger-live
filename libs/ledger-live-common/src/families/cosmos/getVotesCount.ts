import type { Account } from "@ledgerhq/types-live";
import { getCosmosResources } from "@ledgerhq/coin-cosmos/types/index";

export function getVotesCount(account: Account): number {
  return getCosmosResources(account)?.delegations.length ?? 0;
}
