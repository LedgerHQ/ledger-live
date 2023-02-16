import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export interface AccountBannerState {
  stakeProvider: "lido" | "kiln";
}

const ETH_REQUIRED_FOR_KILN = new BigNumber("32000000000000000000");
export function getAccountBannerState(account: Account): AccountBannerState {
  const stakeProvider =
    account.currency.id === "ethereum" &&
    account.balance.gte(ETH_REQUIRED_FOR_KILN)
      ? "kiln"
      : "lido";

  return {
    stakeProvider,
  };
}
