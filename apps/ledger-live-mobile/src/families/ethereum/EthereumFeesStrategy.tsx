import React, { useCallback, useState, useMemo, useEffect } from "react";
import type { Transaction as EthereumTransaction } from "@ledgerhq/live-common/families/ethereum/types";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  EIP1559ShouldBeUsed,
  getGasLimit,
} from "@ledgerhq/live-common/families/ethereum/transaction";
import { FeeStrategy } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import SelectFeesStrategy from "../../components/SelectFeesStrategy";
import { SendRowsFeeProps as Props } from "./types";
import { ScreenName } from "../../const";
import { EthereumNetworkFeeInfo } from "./EthereumNetworkFeesInfo";

const getCustomStrategy = (
  transaction: EthereumTransaction,
  currency: CryptoCurrency,
): (FeeStrategy & { userGasLimit?: BigNumber }) | null => {
  if (transaction.feesStrategy === "custom") {
    return {
      label: "custom",
      amount: transaction.gasPrice || new BigNumber(0),
      displayedAmount: EIP1559ShouldBeUsed(currency)
        ? transaction.maxFeePerGas?.multipliedBy(getGasLimit(transaction))
        : transaction.gasPrice?.multipliedBy(getGasLimit(transaction)),
      userGasLimit: getGasLimit(transaction),
    };
  }

  return null;
};

export default function EthereumFeesStrategy({
  account,
  parentAccount,
  transaction,
  setTransaction,
  navigation,
  route,
  ...props
}: Props<EthereumTransaction>) {
  const { currency } = getMainAccount(account, parentAccount);

  const defaultStrategies = useFeesStrategy(transaction);
  const [customStrategy, setCustomStrategy] = useState(getCustomStrategy(transaction, currency));
  const strategies = useMemo(
    () => (customStrategy ? [...defaultStrategies, customStrategy] : defaultStrategies),
    [defaultStrategies, customStrategy],
  );

  useEffect(() => {
    const newCustomStrategy = getCustomStrategy(transaction, currency);

    if (newCustomStrategy) {
      setCustomStrategy(newCustomStrategy);
    }
  }, [transaction, setCustomStrategy, currency]);

  const onFeesSelected = useCallback(
    ({ amount, label, userGasLimit, extra }) => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(
        bridge.updateTransaction(transaction, {
          gasPrice: amount,
          maxFeePerGas: extra?.maxFeePerGas,
          maxPriorityFeePerGas: extra?.maxPriorityFeePerGas,
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
      parentId: parentAccount?.id,
      transaction,
      currentNavigation: ScreenName.SendSummary,
      nextNavigation: ScreenName.SendSelectDevice,
      setTransaction,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction, setTransaction]);

  return (
    <SelectFeesStrategy
      {...props}
      strategies={strategies}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      NetworkFeesInfoComponent={EthereumNetworkFeeInfo}
    />
  );
}
