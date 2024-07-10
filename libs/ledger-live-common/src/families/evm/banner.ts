import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export interface AccountBannerState {
  stakeProvider: "lido" | "kiln" | "stakekit";
}

const ETH_REQUIRED_FOR_KILN = new BigNumber("32000000000000000000");
export function getAccountBannerState(account: Account): AccountBannerState {
  const stakeProvider = ((): AccountBannerState["stakeProvider"] => {
    if (account.currency.id === "avalanche_c_chain") {
      return "stakekit";
    } else if (account.currency.id === "ethereum" && account.balance.gte(ETH_REQUIRED_FOR_KILN)) {
      return "kiln";
    } else {
      return "lido";
    }
  })();

  return {
    stakeProvider,
  };
}
