import React, { useMemo } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import SelectAccount from "~/renderer/components/SelectAccount";
import { useNewSendFlowFeature } from "LLD/features/Send/hooks/useNewSendFlowFeature";
import { StepProps as SendStepProps } from "~/renderer/modals/Send/types";
import BalanceSelector from "~/renderer/families/aleo/shared/BalanceSelector";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import RecipientField from "~/renderer/modals/Send/fields/RecipientField";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";

const StepRecipient = ({
  t,
  account,
  parentAccount,
  openedFromAccount,
  transaction,
  onChangeAccount,
  onChangeTransaction,
  error,
  status,
  currencyName,
  maybeRecipient,
  onResetMaybeRecipient,
}: SendStepProps) => {
  const { isEnabledForFamily } = useNewSendFlowFeature();

  const accountFilter = useMemo(
    () => (acc: Account) => {
      const family = acc.currency.family;
      return !isEnabledForFamily(family);
    },
    [isEnabledForFamily],
  );

  if (!status || !account) return null;
  if (transaction?.family !== "aleo") return null;
  const mainAccount = getMainAccount(account, parentAccount) as AleoAccount;
  const bridge = getAccountBridge(mainAccount);

  console.log("steprecipient tx status", status);

  const isSelfTransfer = [
    TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
  ].includes(transaction.type);

  return (
    <Box flow={4}>
      <TrackPage
        category="Aleo Send Transfer Flow"
        name="Step Recipient"
        currencyName={currencyName}
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {status.errors && status.errors.sender ? (
        <div data-testid="sender-error-container">
          <ErrorBanner dataTestId="sender-error" error={status.errors.sender} />
        </div>
      ) : null}
      <Box flow={1}>
        <Label>{t("send.steps.details.selectAccountDebit")}</Label>
        <SelectAccount
          id="account-debit-placeholder"
          withSubAccounts
          enforceHideEmptySubAccounts
          autoFocus={!openedFromAccount}
          onChange={onChangeAccount}
          value={account}
          filter={accountFilter}
        />
      </Box>
      {!isSelfTransfer && (
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
      )}
      <BalanceSelector
        mainAccount={mainAccount}
        transaction={transaction}
        onChange={(value: "public" | "private") => {
          let newTransactionType: TRANSACTION_TYPE;

          if (isSelfTransfer) {
            newTransactionType =
              value === "public"
                ? TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
                : TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
          } else {
            newTransactionType =
              value === "public"
                ? TRANSACTION_TYPE.TRANSFER_PUBLIC
                : TRANSACTION_TYPE.TRANSFER_PRIVATE;
          }

          onChangeTransaction(bridge.updateTransaction(transaction, { type: newTransactionType }));
        }}
      />
    </Box>
  );
};

export default StepRecipient;
