import React from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import SelectAccount from "~/renderer/components/SelectAccount";
import type { StepProps } from "~/renderer/modals/Send/types";
import RecipientField from "~/renderer/modals/Send/fields/RecipientField";
import SendRecipientFields from "~/renderer/modals/Send/SendRecipientFields";
import BalanceSelector from "../shared/BalanceSelector";
import { applyAleoBalanceSourceChange, getAleoCurrencyConfig } from "../shared/utils";

export const AleoSendStepRecipient = ({
  t,
  transaction,
  account,
  parentAccount,
  openedFromAccount,
  onChangeAccount,
  onChangeTransaction,
  updateTransaction,
  error,
  status,
  currencyName,
  maybeRecipient,
  onResetMaybeRecipient,
}: StepProps) => {
  if (!status || !account || transaction?.family !== "aleo") {
    return null;
  }

  const isTokenAccount = account.type === "TokenAccount";
  const mainAccount = getMainAccount(account, parentAccount);
  const config = getAleoCurrencyConfig(mainAccount.currency);

  return (
    <Box flow={4}>
      <TrackPage category="Aleo Send Flow" name="Step Recipient" currencyName={currencyName} />
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
            {...(config?.enableTokens && {
              withSubAccounts: true,
              enforceHideEmptySubAccounts: true,
              subAccountFilter: a => !a.balance.isZero(),
            })}
          />
        </Box>
        <Box>
          <Label mb={5}>
            <Trans i18nKey="aleo.send.stepRecipient.selectLabel" />
          </Label>
          <BalanceSelector
            transaction={transaction}
            mainAccount={mainAccount}
            subAccount={isTokenAccount ? account : undefined}
            onChange={value => {
              updateTransaction(tx => {
                if (tx.family !== "aleo") return tx;
                return applyAleoBalanceSourceChange(tx, value);
              });
            }}
          />
        </Box>
        {account && transaction && mainAccount && (
          <>
            <RecipientField
              status={status}
              autoFocus={openedFromAccount}
              account={mainAccount}
              transaction={transaction}
              onChangeTransaction={onChangeTransaction}
              t={t}
              initValue={maybeRecipient}
              resetInitValue={onResetMaybeRecipient}
            />
            <SendRecipientFields
              account={mainAccount}
              parentAccount={parentAccount}
              status={status}
              transaction={transaction}
              onChange={onChangeTransaction}
            />
          </>
        )}
      </>
    </Box>
  );
};
