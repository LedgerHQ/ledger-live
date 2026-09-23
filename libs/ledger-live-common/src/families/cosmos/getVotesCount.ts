import type { Account } from "@ledgerhq/types-live";
import { isStakingAccount } from "@ledgerhq/types-live";

export function getVotesCount(account: Account): number {
  return isStakingAccount(account) ? account.stakingResources.delegations.length : 0;
}
