/* @flow */
import React, { useCallback } from "react";

import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import type { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import type { RouteParams } from "../../screens/SendFunds/04-Summary";
import { ScreenName } from "../../const";
import SelectFeesStrategy from "../../components/SelectFeesStrategy";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  navigation: any,
  route: { params: RouteParams },
  setTransaction: Function,
  ...
};

export default function EthereumFeesStrategy({
  account,
  parentAccount,
  transaction,
  setTransaction,
  navigation,
  route,
  ...props
}: Props) {
  const strategies = useFeesStrategy(transaction);

  const onFeesSelected = useCallback(
    ({ amount, label, userGasLimit, txParameters }) => {
      const bridge = getAccountBridge(account, parentAccount);

      setTransaction(
        bridge.updateTransaction(transaction, {
          gasPrice: amount,
          maxBaseFeePerGas: txParameters?.maxBaseFeePerGas,
          maxPriorityFeePerGas: txParameters?.maxPriorityFeePerGas,
          feesStrategy: label,
          userGasLimit: userGasLimit || transaction.userGasLimit,
        }),
      );
    },
    [setTransaction, account, parentAccount, transaction],
  );

  const openCustomFees = useCallback(() => {
    navigation.navigate(ScreenName.EthereumCustomFees, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction]);

  return (
    <SelectFeesStrategy
      {...props}
      strategies={strategies}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
    />
  );
}
