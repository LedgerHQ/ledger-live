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
import BalanceSelector from "../shared/BalanceSelector";
import { applyAleoBalanceSourceChange, getAleoCurrencyConfig } from "../shared/utils";
import { Trans } from "react-i18next";

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
  if (!status || !account || transaction?.family !== "aleo") {
    return null;
  }

  const mainAccount = getMainAccount(account, parentAccount);
  const config = getAleoCurrencyConfig(mainAccount.currency);

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
            onChange={onChangeAccount}
            value={account}
            filter={accountFilter}
            {...(config?.enableTokens && {
              withSubAccounts: true,
              enforceHideEmptySubAccounts: true,
              subAccountFilter: a => !a.balance.isZero(),
            })}
          />
        </Box>
        <Box>
          <Label mb={5}>
            <Trans i18nKey="aleo.selfTransfer.modal.stepRecipient.selectLabel" />
          </Label>
          <BalanceSelector
            transaction={transaction}
            mainAccount={mainAccount}
            subAccount={account.type === "TokenAccount" ? account : undefined}
            onChange={value => {
              updateTransaction(tx => {
                if (tx.family !== "aleo") return tx;
                return applyAleoBalanceSourceChange(tx, value);
              });
            }}
          />
        </Box>
      </>
    </Box>
  );
};
