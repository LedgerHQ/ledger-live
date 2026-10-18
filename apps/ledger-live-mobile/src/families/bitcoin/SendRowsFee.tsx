import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import type {
  Account,
  AccountLike,
  FeeStrategy,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import { Trans } from "~/context/Locale";
import type { Transaction as BitcoinTransaction } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { useFeesStrategy } from "@ledgerhq/live-common/families/bitcoin/react";
import { CompositeScreenProps } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { ScreenName } from "~/const";
import SelectFeesStrategy, { SelectFeeStrategy } from "~/components/SelectFeesStrategy";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  setTransaction: (..._: Array<Transaction>) => void;
  status?: TransactionStatusCommon;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

// Zcash is a bitcoin-family currency served by coin-zcash: its fee is set by ZIP-317, with
// no rate to pick, and its transaction carries no fee strategies.
export default function BitcoinSendRowsFee(props: Props) {
  // The shared Transaction union does not include coin-zcash's transaction.
  const family: string = props.transaction.family;
  if (family === "zcash") return null;
  return <BitcoinFeeRows {...props} />;
}

function BitcoinFeeRows({
  account,
  transaction,
  parentAccount,
  setTransaction,
  route,
  navigation,
  status,
  ...props
}: Props) {
  invariant(account.type === "Account", "account not found");
  const bridge = useAccountBridge<BitcoinTransaction>(account, parentAccount);
  const defaultStrategies = useFeesStrategy(account, transaction as BitcoinTransaction);
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
    ({ amount, label }: SelectFeeStrategy) => {
      setTransaction(
        bridge.updateTransaction(transaction as BitcoinTransaction, {
          feesStrategy: label as BitcoinTransaction["feesStrategy"],
          feePerByte: amount,
        }),
      );
    },
    [setTransaction, bridge, transaction],
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
  }, [navigation, route.params, account.id, parentAccount?.id, transaction, satPerByte]);

  return (
    <SelectFeesStrategy
      {...props}
      strategies={strategies as FeeStrategy[]}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      forceUnitLabel={<Trans i18nKey="common.satPerVByte" />}
      status={status}
    />
  );
}
