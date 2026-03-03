/**
 * NOTE: this is a copy of the original
 * apps/ledger-live-mobile/src/screens/SendFunds/04-Summary.tsx file,
 * with some changes to make it work with our custom flow
 */

import { getEditTransactionStatus } from "@ledgerhq/coin-evm/editTransaction/index";
import { Transaction as EvmTransaction, TransactionStatus } from "@ledgerhq/coin-evm/types/index";
import { isCurrencySupported } from "@ledgerhq/coin-framework/currencies/index";
import { NotEnoughGas } from "@ledgerhq/errors";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "~/context/Locale";
import EditTransactionSummaryView from "~/components/EditTransaction/EditTransactionSummaryView";
import useEditTransactionSummaryActions from "~/components/EditTransaction/hooks/useEditTransactionSummaryActions";
import Button from "~/components/Button";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SendRowsFee from "~/components/SendRowsFee";
import { NavigatorName, ScreenName } from "~/const";
import { useTransactionChangeFromNavigation } from "~/logic/screenTransactionHooks";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { CurrentNetworkFee } from "../CurrentNetworkFee";
import { EditTransactionParamList } from "./EditTransactionParamList";

type Navigation = BaseComposite<
  StackNavigatorProps<EditTransactionParamList, ScreenName.EditTransactionSummary>
>;

type Props = Navigation;

function EditTransactionSummary({ navigation, route }: Props) {
  const { nextNavigation, overrideAmountLabel, transactionRaw, editType } = route.params;

  const { account, parentAccount } = useAccountScreen(route);

  invariant(account, "account is missing");
  invariant(transactionRaw, "transactionRaw is missing");

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

  const transactionToUpdate = fromTransactionRaw(transactionRaw) as EvmTransaction;

  const status = getEditTransactionStatus({
    transaction: transaction as EvmTransaction,
    transactionToUpdate,
    status: txStatus as TransactionStatus,
    editType,
  });

  invariant(transaction, "transaction is missing");

  // handle any edit screen changes like fees changes
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

  const mainAccount = getMainAccount(account, parentAccount);
  const currencyOrToken = getAccountCurrency(account);

  const hasNonEmptySubAccounts =
    account.type === "Account" &&
    (account.subAccounts || []).some(subAccount => subAccount.balance.gt(0));

  const onBuyEth = useCallback(() => {
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: {
        defaultAccountId: account?.id,
        defaultCurrencyId: currencyOrToken?.id,
      },
    });
  }, [navigation, account?.id, currencyOrToken?.id]);

  // FIXME: why is recipient sometimes empty?
  if (!transaction.recipient) {
    return null;
  }

  let footerAction;
  if (firstError && firstError instanceof NotEnoughGas) {
    footerAction = isCurrencySupported(currencyOrToken as CryptoCurrency) ? (
      <Button
        event="SummaryBuyEth"
        type="primary"
        title={<Trans i18nKey="common.buyEth" />}
        onPress={onBuyEth}
      />
    ) : null;
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
        <SendRowsFee
          setTransaction={setTransaction}
          status={status}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          navigation={navigation as never}
          route={route as never}
          transactionToUpdate={transactionToUpdate}
        />
      }
      additionalRows={
        <CurrentNetworkFee
          account={account}
          parentAccount={parentAccount}
          transactionRaw={transactionRaw}
        />
      }
      footerAction={footerAction}
      isContinueDisabled={bridgePending || !!firstError}
      isContinuePending={bridgePending}
      onContinue={onContinue}
      highFeesOpen={highFeesOpen}
      onRejectFees={onRejectFees}
      onAcceptFees={onAcceptFees}
    />
  );
}

export default EditTransactionSummary;
