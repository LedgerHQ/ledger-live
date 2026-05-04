import type { TronAccount } from "@ledgerhq/coin-tron/types/index";

export function getVotesCount(account: TronAccount): number {
  return account.tronResources.votes.length;
}
