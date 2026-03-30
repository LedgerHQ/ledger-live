/**
 * Bitcoin RBF edit transaction summary (cancel / speed up).
 */

import {
  getEditTransactionStatus,
  type GetEditTransactionStatusParams,
} from "@ledgerhq/coin-bitcoin/editTransaction/index";
import { getOriginalTxFeeRateSatVb } from "@ledgerhq/coin-bitcoin/rbfHelpers";
import type {
  Transaction as BtcTransaction,
  TransactionStatus,
} from "@ledgerhq/coin-bitcoin/types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import React, { useEffect, useMemo, useState } from "react";
import EditTransactionSummaryView from "~/components/EditTransaction/EditTransactionSummaryView";
import useEditTransactionSummaryActions from "~/components/EditTransaction/hooks/useEditTransactionSummaryActions";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTransactionChangeFromNavigation } from "~/logic/screenTransactionHooks";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import BitcoinSendRowsFee from "~/families/bitcoin/SendRowsFee";
import type { BitcoinEditTransactionParamList } from "./EditTransactionParamList";

type Navigation = BaseComposite<
  StackNavigatorProps<BitcoinEditTransactionParamList, ScreenName.EditTransactionSummary>
>;

type Props = Navigation;

function BitcoinEditTransactionSummary({ navigation, route }: Props) {
  const { nextNavigation, overrideAmountLabel, transactionRaw, editType } = route.params;

  const { account, parentAccount } = useAccountScreen(route);
  invariant(account, "account is missing");
  invariant(transactionRaw, "transactionRaw is missing");

  const mainAccount = getMainAccount(account, parentAccount);

  const {
    transaction,
    setTransaction,
    status: txStatus,
    bridgePending,
  } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
    parentAccount,
  }));

  const transactionToUpdate = useMemo<BtcTransaction>(
    () => fromTransactionRaw(transactionRaw) as BtcTransaction,
    [transactionRaw],
  );

  const [originalFeePerByte, setOriginalFeePerByte] = useState<BigNumber | null>(null);

  // When transactionToUpdate.feePerByte is missing (e.g. not stored in operation), fetch original tx fee rate for RBF validation
  useEffect(() => {
    const replaceTxId = transactionToUpdate.replaceTxId;
    const hasFeePerByte =
      transactionToUpdate.feePerByte != null && !transactionToUpdate.feePerByte.isNaN();

    if (!replaceTxId || hasFeePerByte) {
      setOriginalFeePerByte(null);
      return;
    }

    let cancelled = false;
    getOriginalTxFeeRateSatVb(mainAccount, replaceTxId).then((fee: BigNumber | null) => {
      if (!cancelled) {
        setOriginalFeePerByte(fee);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mainAccount, transactionToUpdate.replaceTxId, transactionToUpdate.feePerByte]);

  const statusParams: GetEditTransactionStatusParams = {
    editType,
    transaction: transaction as BtcTransaction,
    transactionToUpdate,
    status: txStatus as TransactionStatus,
    ...(originalFeePerByte != null ? { originalFeePerByte } : {}),
  };

  const status = getEditTransactionStatus(statusParams);

  invariant(transaction, "transaction is missing");

  useTransactionChangeFromNavigation(setTransaction);

  const { amount, totalSpent, errors, warnings } = status;
  const { highFeesOpen, onAcceptFees, onRejectFees, onContinue } = useEditTransactionSummaryActions(
    {
      navigation,
      nextNavigation,
      routeParams: route.params,
      transaction,
      status,
      feeTooHigh: warnings.feeTooHigh,
    },
  );

  const firstError = errors[Object.keys(errors)[0]];

  const currencyOrToken = getAccountCurrency(account);

  const hasNonEmptySubAccounts =
    account.type === "Account" &&
    (account.subAccounts || []).some(subAccount => subAccount.balance.gt(0));

  if (!transaction.recipient) {
    return null;
  }

  return (
    <EditTransactionSummaryView
      mainAccount={mainAccount}
      transaction={transaction}
      amount={amount}
      totalSpent={totalSpent}
      firstError={firstError}
      currencyName={currencyOrToken?.name}
      subAccountCurrencyName={currencyOrToken?.name}
      showSubAccountsWarning={Boolean(transaction.useAllAmount && hasNonEmptySubAccounts)}
      overrideAmountLabel={overrideAmountLabel}
      recipientWarning={warnings.recipient}
      feeRows={
        <BitcoinSendRowsFee
          setTransaction={setTransaction}
          status={status}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          navigation={navigation as never}
          route={route as never}
        />
      }
      isContinueDisabled={bridgePending || !!firstError}
      isContinuePending={bridgePending}
      onContinue={onContinue}
      highFeesOpen={highFeesOpen}
      onRejectFees={onRejectFees}
      onAcceptFees={onAcceptFees}
    />
  );
}

export default BitcoinEditTransactionSummary;
