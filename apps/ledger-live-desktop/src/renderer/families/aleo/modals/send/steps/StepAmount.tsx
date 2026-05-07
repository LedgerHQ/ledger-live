import React, { Fragment, useCallback, useState } from "react";
import invariant from "invariant";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import SpendableBanner from "~/renderer/components/SpendableBanner";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import AmountField from "~/renderer/modals/Send/fields/AmountField";
import type { StepProps } from "~/renderer/modals/Send/types";
import QuickAmountSelector from "../../../shared/QuickAmountSelector";
import InfoBanner from "../../../shared/InfoBanner";
import { isAleoAccount, isAleoTransaction } from "./utils";
import { getAleoCurrencyConfig } from "../../../shared/utils";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";

const StepAmount = (props: StepProps) => {
  const {
    t,
    account,
    parentAccount,
    transaction,
    onChangeTransaction,
    error,
    status,
    bridgePending,
    maybeAmount,
    onResetMaybeAmount,
    updateTransaction,
    currencyName,
    walletConnectProxy,
  } = props;
  const [amountFieldKey, setAmountFieldKey] = useState(0);

  invariant(transaction, "transaction required");
  invariant(account, "account required");

  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "main account required");

  const currencyConfig = getAleoCurrencyConfig(mainAccount.currency);
  const isAutoPickingStrategy =
    currencyConfig?.recordPickingStrategy === "auto" &&
    isAleoTransaction(transaction) &&
    isPrivateTransaction(transaction);

  const isQuickSelectApplied = amountFieldKey > 0;
  const handleQuickSelect = useCallback(() => {
    setAmountFieldKey(k => k + 1);
  }, []);

  if (!status) return null;

  return (
    <Box flow={4} data-testid="aleo-step-amount">
      <TrackPage
        category="Send Flow"
        name="Step Amount"
        currencyName={currencyName}
        walletConnectSend={walletConnectProxy}
      />
      <CurrencyDownStatusAlert currencies={[mainAccount.currency]} />
      {error ? <ErrorBanner error={error} /> : null}
      <Fragment key={account.id}>
        {isAutoPickingStrategy ? (
          <InfoBanner />
        ) : (
          <SpendableBanner
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
          />
        )}

        <AmountField
          key={amountFieldKey}
          status={status}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          onChangeTransaction={onChangeTransaction}
          bridgePending={bridgePending}
          walletConnectProxy={walletConnectProxy}
          t={t}
          initValue={isQuickSelectApplied ? transaction.amount : maybeAmount}
          resetInitValue={isQuickSelectApplied ? undefined : onResetMaybeAmount}
        />

        {isAleoAccount(account) && isAutoPickingStrategy && (
          <QuickAmountSelector
            account={account}
            transaction={transaction}
            updateTransaction={updateTransaction}
            onSelect={handleQuickSelect}
          />
        )}

        <SendAmountFields
          account={mainAccount}
          parentAccount={parentAccount}
          status={status}
          transaction={transaction}
          onChange={onChangeTransaction}
          bridgePending={bridgePending}
          updateTransaction={updateTransaction}
        />
      </Fragment>
    </Box>
  );
};

export default StepAmount;
