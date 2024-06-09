import BigNumber from "bignumber.js";
import { MinaAPIAccount } from "../types";
import { fetchAccountBalance, fetchAccountTransactions, fetchNetworkStatus } from "./rosetta";
import { RosettaTransaction } from "./rosetta/types";

export const getAccount = async (address: string): Promise<MinaAPIAccount> => {
  const networkStatus = await fetchNetworkStatus();
  const balance = await fetchAccountBalance(address);

  return {
    blockHeight: networkStatus.current_block_identifier.index,
    balance: new BigNumber(balance.balances[0].metadata.total_balance),
    spendableBalance: new BigNumber(balance.balances[0].metadata.liquid_balance),
  };
};

export const getTransactions = async (address: string): Promise<RosettaTransaction[]> => {
  const res = await fetchAccountTransactions(address);

  return res.transactions;
};

export const broadcastTransaction = (_sig: string): string => {
  return "";
};

export const getFees = (): BigNumber => {
  return new BigNumber(0);
};
