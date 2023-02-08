import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export interface AccountBannerState {
  stakeProvider: "lido" | "kiln";
}

const THIRTY_TWO_ETH = new BigNumber("32000000000000000000");
export function getAccountBannerState(account: Account): AccountBannerState {
  const isOver32Eth =
    account.currency.id === "ethereum" && account.balance.gte(THIRTY_TWO_ETH);
  const stakeProvider = isOver32Eth ? "kiln" : "lido";

  return {
    stakeProvider,
  };
}
