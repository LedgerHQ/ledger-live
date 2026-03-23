import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { fetchAccountBalance, fetchNetworkStatus } from "../../api";
import { MinaAPIAccount } from "../../types/common";

export const getAccount = async (address: string): Promise<MinaAPIAccount> => {
  const networkStatus = await fetchNetworkStatus();
  let balance = new BigNumber(0);
  let spendableBalance = new BigNumber(0);
  try {
    const resp = await fetchAccountBalance(address);
    balance = new BigNumber(resp.balances[0].metadata.total_balance);
    spendableBalance = new BigNumber(resp.balances[0].metadata.liquid_balance);
  } catch (e) {
    log("info", "[mina] getAccount error:", {
      address,
      error: e,
    });
    // fail is expected for when account has no balance and no transactions
    /* empty */
  }

  return {
    blockHeight: networkStatus.current_block_identifier.index,
    balance,
    spendableBalance,
  };
};
