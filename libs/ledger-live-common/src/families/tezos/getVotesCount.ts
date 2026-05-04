import type { Account } from "@ledgerhq/types-live";
import { isAccountDelegating } from "./staking";

export function getVotesCount(account: Account): number {
  return isAccountDelegating(account) ? 1 : 0;
}
