import BigNumber from "bignumber.js";
import { MinaAPIAccount } from "../types";

export const getAccount = (_address: string): MinaAPIAccount => {
  return {
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
  };
};

export const getOperations = (_address: string): any[] => {
  return [];
};

export const fetchAccountBalance = (_address: string): BigNumber => {
  return new BigNumber(0);
};

export const broadcastTransaction = (_sig: string): string => {
  return "";
};

export const getFees = (): BigNumber => {
  return new BigNumber(0);
};
