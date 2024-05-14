import { BigNumber } from "bignumber.js";
// import { MinaLedgerJS } from "mina-ledger-js";
import { Transaction, MinaAccount } from "./types";
// import {} from "./constants";

export const isValidAddress = (address: string): boolean => {
  const readableAddressRegex = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
  const hexAddressRegex = /^[a-f0-9]{64}$/;

  if (isImplicitAccount(address)) {
    return hexAddressRegex.test(address);
  }

  return readableAddressRegex.test(address);
};

export const isImplicitAccount = (address: string): boolean => {
  return !address.includes(".");
};

/*
 * Get the max amount that can be spent, taking into account tx type and pending operations.
 */
export const getMaxAmount = (a: MinaAccount, t: Transaction, fees?: BigNumber): BigNumber => {
  let maxAmount;

  let pendingDefaultAmount = new BigNumber(0);

  a.pendingOperations.forEach(({ value }) => {
    pendingDefaultAmount = pendingDefaultAmount.plus(value);
  });

  maxAmount = a.spendableBalance.minus(pendingDefaultAmount);
  if (fees) {
    maxAmount = maxAmount.minus(fees);
  }
  if (maxAmount === undefined || maxAmount.lt(0)) {
    return new BigNumber(0);
  }

  return maxAmount;
};

export const getTotalSpent = (a: MinaAccount, t: Transaction, fees: BigNumber): BigNumber => {
  if (t.useAllAmount) {
    return a.spendableBalance;
  }

  return new BigNumber(t.amount).plus(fees);
};
