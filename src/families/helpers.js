/* @flow */

import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

export const getFieldByFamily = (
  account: Account,
  navigation: NavigationScreenProp<*>,
  field: string,
) => {
  const transaction = navigation.getParam("transaction");
  const bridge = getAccountBridge(account);
  return bridge.getTransactionExtra(account, transaction, field);
};
export const editTxFeeByFamily = (
  account: Account,
  navigation: NavigationScreenProp<*>,
  field: string,
  fee: ?BigNumber,
) => {
  const transaction = navigation.getParam("transaction");
  const bridge = getAccountBridge(account);
  return bridge.updateTransaction(transaction, { [field]: fee });
};
