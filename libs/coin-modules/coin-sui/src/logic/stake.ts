import { ONE_SUI } from "../constants";
import { SuiAccount } from "../types";

/*
 * Make sure that an account has enough funds to stake, unstake, AND withdraw before staking.
 */
export const canStake = (account: SuiAccount): boolean => {
  return account.balance.gte(ONE_SUI);
};
