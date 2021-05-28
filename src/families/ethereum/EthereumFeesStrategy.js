/* @flow */
import React, { useCallback } from "react";

import { useFeesStrategy } from "@ledgerhq/live-common/lib/families/ethereum/react";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
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
};

export default function EthereumFeesStrategy({
  account,
  parentAccount,
  transaction,
  setTransaction,
  navigation,
  route,
}: Props) {
  let strategies = useFeesStrategy(transaction);
  const { customGasPrice, customGasLimit } = route.params;
  if (customGasPrice && customGasLimit) {
    strategies = [
      ...strategies.map(s => ({
        ...s,
        userGasLimit: transaction.estimatedGasLimit,
      })),
      {
        label: "custom",
        forceValueLabel: null,
        amount: customGasPrice,
        displayedAmount: customGasLimit.times(customGasPrice),
        userGasLimit: customGasLimit,
      },
    ];
  }

  const onFeesSelected = useCallback(
    ({ amount, label, userGasLimit }) => {
      const bridge = getAccountBridge(account, parentAccount);

      setTransaction(
        bridge.updateTransaction(transaction, {
          gasPrice: amount,
          feesStrategy: label,
          userGasLimit,
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
      customGasPrice,
      customGasLimit,
    });
  }, [
    customGasPrice,
    customGasLimit,
    navigation,
    route.params,
    account.id,
    parentAccount,
    transaction,
  ]);

  return (
    <SelectFeesStrategy
      strategies={strategies}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
    />
  );
}
