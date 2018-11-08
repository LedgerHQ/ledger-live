/* @flow */

import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "../bridge";

export const getFeeByFamily = (
  account: Account,
  navigation: NavigationScreenProp<*>,
) => {
  const transaction = navigation.getParam("transaction");
  const bridge = getAccountBridge(account);

  switch (account.currency.family) {
    case "ripple":
      return bridge.getTransactionExtra(account, transaction, "fee");
    case "ethereum":
      return bridge.getTransactionExtra(account, transaction, "gasPrice");
    default:
      return null;
  }
};

export const editTxFeeByFamily = (
  account: Account,
  navigation: NavigationScreenProp<*>,
  fee: ?BigNumber,
) => {
  const transaction = navigation.getParam("transaction");
  const bridge = getAccountBridge(account);
  switch (account.currency.family) {
    case "ripple":
      return bridge.editTransactionExtra(account, transaction, "fee", fee);
    case "ethereum":
      return bridge.editTransactionExtra(account, transaction, "gasPrice", fee);
    default:
      return null;
  }
};
