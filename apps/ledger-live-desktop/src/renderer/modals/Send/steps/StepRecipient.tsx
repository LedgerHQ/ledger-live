import React, { PureComponent } from "react";
import { getStuckAccountAndOperation } from "@ledgerhq/live-common/operation";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import SelectAccount from "~/renderer/components/SelectAccount";
import SelectNFT from "~/renderer/screens/nft/Send/SelectNFT";
import SendRecipientFields, { getFields } from "../SendRecipientFields";
import RecipientField from "../fields/RecipientField";
import { StepProps } from "../types";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import { Account } from "@ledgerhq/types-live";
import EditOperationPanel from "~/renderer/components/OperationsList/EditOperationPanel";

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
  maybeRecipient,
  onResetMaybeRecipient,
  maybeNFTId,
  currencyName,
  isNFTSend,
  onChangeNFT,
  maybeNFTCollection,
}: StepProps) => {
  if (!status || !account) return null;
  const mainAccount = getMainAccount(account, parentAccount);
  // for ethereum family, check if there is a stuck transaction. If so, display a warning panel with "speed up or cancel" button
  const stuckAccountAndOperation = getStuckAccountAndOperation(account, parentAccount);

  return (
    <Box flow={4}>
      <TrackPage
        category="Send Flow"
        name="Step Recipient"
        currencyName={currencyName}
        isNFTSend={isNFTSend}
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {isNFTSend ? (
        <Box flow={1}>
          <Label>{t("send.steps.recipient.nftRecipient")}</Label>
          {account && (
            <SelectNFT
              onSelect={onChangeNFT}
              maybeNFTId={maybeNFTId}
              maybeNFTCollection={maybeNFTCollection}
              account={account as Account}
            />
          )}
        </Box>
      ) : (
        <Box flow={1}>
          <Label>{t("send.steps.details.selectAccountDebit")}</Label>
          <SelectAccount
            withSubAccounts
            enforceHideEmptySubAccounts
            autoFocus={!openedFromAccount}
            onChange={onChangeAccount}
            value={account}
          />
        </Box>
      )}
      {stuckAccountAndOperation ? (
        <EditOperationPanel
          operation={stuckAccountAndOperation.operation}
          account={stuckAccountAndOperation.account}
          parentAccount={stuckAccountAndOperation.parentAccount}
        />
      ) : null}
      <StepRecipientSeparator />
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
    </Box>
  );
};
export class StepRecipientFooter extends PureComponent<StepProps> {
  onNext = async () => {
    const { transitionTo, shouldSkipAmount } = this.props;
    if (shouldSkipAmount) {
      transitionTo("summary");
    } else {
      transitionTo("amount");
    }
  };

  render() {
    const { t, account, parentAccount, status, bridgePending } = this.props;
    const { errors } = status;
    const mainAccount = account ? getMainAccount(account, parentAccount) : null;
    const isTerminated = mainAccount && mainAccount.currency.terminated;
    const fields = ["recipient"].concat(mainAccount ? getFields(mainAccount) : []);
    const hasFieldError = Object.keys(errors).some(name => fields.includes(name));
    const canNext = !bridgePending && !hasFieldError && !isTerminated;
    return (
      <>
        <Button
          id={"send-recipient-continue-button"}
          isLoading={bridgePending}
          primary
          disabled={!canNext}
          onClick={this.onNext}
        >
          {t("common.continue")}
        </Button>
      </>
    );
  }
}

export default StepRecipient;
