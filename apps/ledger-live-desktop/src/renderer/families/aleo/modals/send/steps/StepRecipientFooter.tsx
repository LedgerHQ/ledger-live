import React from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import Button from "~/renderer/components/Button";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import type { StepProps } from "~/renderer/modals/Send/types";

/**
 * Recipient step footer:
 * - private transaction -> transition to "private-sync" (record-sync required before picking a record)
 * - public transaction -> transition to "amount" directly
 */
const StepRecipientFooter = ({
  account,
  parentAccount,
  status,
  bridgePending,
  transitionTo,
  transaction,
}: StepProps) => {
  if (!account || !transaction || transaction.family !== "aleo") return null;

  const { errors } = status;
  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const isTerminated = mainAccount.currency.terminated;
  const hasFieldError = Object.keys(errors).some(name => ["recipient", "sender"].includes(name));
  const canNext = !bridgePending && !hasFieldError && !isTerminated;

  const onNext = () => {
    if (isPrivateTransaction(transaction)) {
      transitionTo("private-sync");
    } else {
      transitionTo("amount");
    }
  };

  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Button
        id="send-recipient-continue-button"
        isLoading={bridgePending}
        primary
        disabled={!canNext}
        onClick={onNext}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
};

export default StepRecipientFooter;
