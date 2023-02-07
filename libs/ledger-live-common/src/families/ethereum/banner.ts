import { Account } from "@ledgerhq/types-live";

export interface AccountBannerState {
  stakeProvider: "lido" | "kiln";
}

export function getAccountBannerState(account: Account): AccountBannerState {
  const stakeProvider = account.balance.gte(32) ? "kiln" : "lido";

  return {
    stakeProvider,
  };
}
