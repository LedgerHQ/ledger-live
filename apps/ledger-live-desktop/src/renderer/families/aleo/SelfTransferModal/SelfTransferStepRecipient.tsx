import React from "react";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import SelectAccount from "~/renderer/components/SelectAccount";
import type { StepProps } from "~/renderer/modals/Send/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useHandleChangeAccount } from "./useHandleChangeAccount";
import BalanceSelector from "../shared/BalanceSelector";

export const SelfTransferStepRecipient = ({
  t,
  transaction,
  account,
  parentAccount,
  openedFromAccount,
  onChangeAccount,
  updateTransaction,
  error,
  status,
  currencyName,
}: StepProps) => {
  // change account with updating "recipient" field that cannot be controlled manually
  const handleChangeAccount = useHandleChangeAccount({ onChangeAccount, updateTransaction });

  if (!status || !account || transaction?.family !== "aleo") {
    return null;
  }

  const mainAccount = getMainAccount(account, parentAccount);

  // show only Aleo accounts
  const accountFilter = (acc: AccountLike) => {
    return getAccountCurrency(acc) === mainAccount.currency;
  };

  return (
    <Box flow={4}>
      <TrackPage
        category="Aleo Self Transfer Flow"
        name="Step Recipient"
        currencyName={currencyName}
      />
      <>
        {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
        {error ? <ErrorBanner error={error} /> : null}
        {status.errors?.sender ? (
          <div data-testid="sender-error-container">
            <ErrorBanner dataTestId="sender-error" error={status.errors.sender} />
          </div>
        ) : null}
        <Box flow={1}>
          <Label>{t("send.steps.details.selectAccountDebit")}</Label>
          <SelectAccount
            id="account-debit-placeholder"
            autoFocus={!openedFromAccount}
            onChange={handleChangeAccount}
            value={account}
            filter={accountFilter}
          />
        </Box>
        <Box>
          <BalanceSelector
            transaction={transaction}
            mainAccount={mainAccount}
            onChange={value => {
              // TODO: update transaction type
              console.log(value);
            }}
          />
        </Box>
      </>
    </Box>
  );
};
