/* @flow */
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { makeCompoundSummaryForAccount } from "@ledgerhq/live-common/lib/compound/logic";
import type { TokenCurrency } from "@ledgerhq/live-common/lib/types";
import {
  findCompoundToken,
  formatCurrencyUnit,
} from "@ledgerhq/live-common/lib/currencies";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account/helpers";
import { accountScreenSelector } from "../../../reducers/accounts";
import { localeSelector } from "../../../reducers/settings";
import { ScreenName } from "../../../const";

import AmountScreen from "../shared/01-Amount";
import LendingWarnings from "../shared/LendingWarnings";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  parentId: string,
  currency: TokenCurrency,
};

export default function WithdrawAmount({ navigation, route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const locale = useSelector(localeSelector);
  invariant(
    account && account.type === "TokenAccount",
    "token account required",
  );

  const capabilities = makeCompoundSummaryForAccount(account, parentAccount);
  const max = capabilities?.totalSupplied ?? BigNumber(0);
  const bridge = getAccountBridge(account, parentAccount);
  const ctoken = findCompoundToken(account.token);
  const unit = getAccountUnit(account);
  const tokenUnit = ctoken?.units[0];

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => {
    // $FlowFixMe
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      recipient: ctoken?.contractAddress || "",
      mode: "compound.withdraw",
      useAllAmount: true,
      amount: max,
      subAccountId: account.id,
      gasPrice: null,
      userGasLimit: null,
    });

    return { account, parentAccount, transaction };
  });

  invariant(transaction, "transaction required");

  const onChangeSendMax = useCallback(
    (useAllAmount: boolean) => {
      setTransaction(
        bridge.updateTransaction(transaction, {
          useAllAmount,
          amount: useAllAmount ? BigNumber(0) : max,
        }),
      );
    },
    [setTransaction, bridge, transaction, max],
  );

  const onContinue = useCallback(() => {
    const formattedAmount =
      status.amount &&
      formatCurrencyUnit(
        transaction.useAllAmount && tokenUnit ? tokenUnit : unit,
        status.amount,
        {
          showAllDigits: false,
          disableRounding: false,
          showCode: true,
          locale,
        },
      );
    navigation.navigate(ScreenName.LendingWithdrawSummary, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      currentNavigation: ScreenName.LendingWithdrawSummary,
      nextNavigation: ScreenName.LendingWithdrawSelectDevice,
      hideTotal: true,
      overrideAmountLabel: formattedAmount,
    });
  }, [
    account.id,
    navigation,
    parentAccount,
    route.params,
    status.amount,
    tokenUnit,
    transaction,
    unit,
  ]);

  return (
    <>
      <LendingWarnings />
      <AmountScreen
        navigation={navigation}
        route={route}
        transaction={transaction}
        setTransaction={setTransaction}
        status={status}
        bridgePending={bridgePending}
        bridgeError={bridgeError}
        max={max}
        onChangeSendMax={onChangeSendMax}
        onContinue={onContinue}
        category={"Lend Withdraw"}
      />
    </>
  );
}
