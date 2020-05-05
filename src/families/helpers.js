/* @flow */

import type { Account } from "@ledgerhq/live-common/lib/types";
import { useRoute } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

export function useFieldByFamily(field: string): ?BigNumber {
  return useRoute().params?.transaction[field];
}

export function useEditTxFeeByFamily() {
  const transaction = useRoute().params?.transaction;

  return ({
    account,
    field,
    fee,
  }: {
    account: Account,
    field: string,
    fee: ?BigNumber,
  }) => {
    const bridge = getAccountBridge(account);
    return bridge.updateTransaction(transaction, { [field]: fee });
  };
}
