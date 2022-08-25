import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useFeesStrategy } from "@ledgerhq/live-common/families/bitcoin/react";
import { ScreenName } from "../../const";
import SelectFeesStrategy from "../../components/SelectFeesStrategy";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  navigation: any;
  route: {
    params: any;
  };
  setTransaction: (..._: Array<any>) => any;
};
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
  const defaultStrategies = useFeesStrategy(account, transaction);
  const [satPerByte, setSatPerByte] = useState(null);
  const strategies = useMemo(
    () =>
      transaction.feesStrategy === "custom"
        ? [
            ...defaultStrategies,
            {
              label: transaction.feesStrategy,
              forceValueLabel: null,
              amount: transaction.feePerByte,
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
      transaction,
      satPerByte,
      setSatPerByte,
    });
  }, [navigation, route.params, account.id, transaction, satPerByte]);
  return (
    <SelectFeesStrategy
      {...props}
      strategies={strategies}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      forceUnitLabel={<Trans i18nKey="common.satPerByte" />}
    />
  );
}
