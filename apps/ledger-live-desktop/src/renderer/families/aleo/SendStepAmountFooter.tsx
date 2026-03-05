import React from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import Button from "~/renderer/components/Button";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import type { StepProps } from "~/renderer/modals/Send/types";
import { AMOUNT_NESTED_STEPS } from "./constants";
import { aleoSendFlowAmountNestedStepSelector, setAmountNestedStep } from "./reducers/aleoSendFlow";

// FIXME: this should control nested steps like switching from "record picker" to "amount"
const StepAmountFooter = ({
  transaction,
  account,
  parentAccount,
  status,
  bridgePending,
  transitionTo,
}: StepProps) => {
  const dispatch = useDispatch();
  const nestedStep = useSelector(aleoSendFlowAmountNestedStepSelector);

  if (!account || transaction?.family !== "aleo") return null;

  const { errors } = status;
  const isPrivateTx = isPrivateTransaction(transaction);
  const mainAccount = getMainAccount(account, parentAccount);
  const isTerminated = mainAccount.currency.terminated;
  const hasErrors = Object.keys(errors).length;
  const canNext = (() => {
    // FIXME: update getTransactionStatus
    if (nestedStep === AMOUNT_NESTED_STEPS.RECORD_PICKER) {
      return true;
    }

    return !bridgePending && !hasErrors && !isTerminated;
  })();

  const onNext = () => {
    if (isPrivateTx && nestedStep === AMOUNT_NESTED_STEPS.RECORD_PICKER) {
      dispatch(setAmountNestedStep(AMOUNT_NESTED_STEPS.AMOUNT));
    } else {
      transitionTo("summary");
    }
  };

  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Button
        id={"send-amount-continue-button"}
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

export default StepAmountFooter;
