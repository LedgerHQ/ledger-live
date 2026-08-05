import type { Vote } from "@ledgerhq/coin-tron/types/index";
import type { Account } from "@ledgerhq/types-live";

/**
 * Unlike `TronAccount`, both levels are optional here: this is reached from generic account-list code
 * for any Tron account, including one synced before the chain-specific enrichment attached
 * `tronResources` (the hook returns nothing for an unactivated address).
 */
type AccountWithOptionalTronResources = Account & {
  tronResources?: { votes?: Vote[] };
};

export function getVotesCount(account: AccountWithOptionalTronResources): number {
  return account.tronResources?.votes?.length ?? 0;
}
