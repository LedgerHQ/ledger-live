import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import type { Account, AccountLike, FeeStrategy } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import type { Transaction as BitcoinTransaction } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useFeesStrategy } from "@ledgerhq/live-common/families/bitcoin/react";
import { CompositeScreenProps } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { ScreenName } from "../../const";
import SelectFeesStrategy from "../../components/SelectFeesStrategy";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  setTransaction: (..._: Array<Transaction>) => void;
} & CompositeScreenProps<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function BitcoinSendRowsFee({
  account,
  transaction,
  parentAccount,
  setTransaction,
  route,
  navigation,
  ...props
}: Props) {
  invariant(account.type === "Account", "account not found");
  const defaultStrategies = useFeesStrategy(
    account,
    transaction as BitcoinTransaction,
  );
  const [satPerByte, setSatPerByte] = useState<BigNumber | null>(null);
  const strategies = useMemo(
    () =>
      transaction.feesStrategy === "custom"
        ? [
            ...defaultStrategies,
            {
              label: transaction.feesStrategy,
              forceValueLabel: null,
              amount: (transaction as BitcoinTransaction).feePerByte,
              unit: defaultStrategies[0].unit,
            },
          ]
        : defaultStrategies,
    [defaultStrategies, transaction],
  );
  const onFeesSelected = useCallback(
    ({ amount, label }) => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(
        bridge.updateTransaction(transaction, {
          feesStrategy: label,
          feePerByte: amount,
        }),
      );
    },
    [setTransaction, account, parentAccount, transaction],
  );
  const openCustomFees = useCallback(() => {
    navigation.navigate(ScreenName.BitcoinEditCustomFees, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction: transaction as BitcoinTransaction,
      satPerByte,
      setSatPerByte,
    });
  }, [
    navigation,
    route.params,
    account.id,
    parentAccount?.id,
    transaction,
    satPerByte,
  ]);
  return (
    <SelectFeesStrategy
      {...props}
      strategies={strategies as FeeStrategy[]}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      forceUnitLabel={<Trans i18nKey="common.satPerByte" />}
    />
  );
}
