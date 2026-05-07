import React from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import Button from "~/renderer/components/Button";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import type { StepProps } from "~/renderer/modals/Send/types";

const StepRecordPickerFooter = ({
  account,
  parentAccount,
  status,
  bridgePending,
  transitionTo,
  transaction,
}: StepProps) => {
  if (!account) return null;

  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const isTerminated = mainAccount.currency.terminated;

  const isPrivateWithoutRecord =
    transaction?.family === "aleo" &&
    isPrivateTransaction(transaction) &&
    (transaction.properties?.amountRecordCommitments ?? []).length === 0;
  const hasRecordError = !!status.errors.amountRecord || !!status.errors.feeRecord;

  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Button
        id="aleo-record-picker-continue-button"
        isLoading={bridgePending}
        primary
        disabled={!!isTerminated || isPrivateWithoutRecord || hasRecordError}
        onClick={() => transitionTo("amount")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
};

export default StepRecordPickerFooter;
