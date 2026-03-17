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
import { Trans } from "react-i18next";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";

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
          <Label mb={5}>
            <Trans i18nKey="aleo.selfTransfer.modal.stepRecipient.selectLabel" />
          </Label>
          <BalanceSelector
            transaction={transaction}
            mainAccount={mainAccount}
            onChange={value => {
              updateTransaction(t => {
                if (t.family !== "aleo") return t;

                if (value === "public") {
                  const { properties: _ignoredProperties, ...txWithoutProperties } = t;
                  return {
                    ...txWithoutProperties,
                    mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
                  };
                }

                return {
                  ...t,
                  mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
                  properties: {
                    amountRecordCommitment: null,
                    feeRecordCommitment: null,
                  },
                };
              });
            }}
          />
        </Box>
      </>
    </Box>
  );
};
