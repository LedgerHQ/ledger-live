import React, { useEffect } from "react";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { StepProps } from "~/renderer/modals/Send/types";
import { DefaultStepAmount } from "~/renderer/modals/Send/steps/StepAmount";
import { AMOUNT_NESTED_STEPS } from "./constants";
import { StepMandatoryPrivateSync } from "./shared/StepMandatoryPrivateSync";
import { StepRecordPicker } from "./shared/StepRecordPicker";
import {
  aleoSendFlowAmountNestedStepSelector,
  resetAleoSendFlowState,
  setAmountNestedStep,
} from "./reducers/aleoSendFlow";

const SendStepAmount = (props: StepProps) => {
  const dispatch = useDispatch();
  const nestedStep = useSelector(aleoSendFlowAmountNestedStepSelector);

  // simulate private sync
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(setAmountNestedStep(AMOUNT_NESTED_STEPS.RECORD_PICKER));
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [dispatch]);

  // reset when leaving the amount step
  useEffect(() => {
    return () => {
      dispatch(resetAleoSendFlowState());
    };
  }, [dispatch]);

  if (!props.transaction || props.transaction?.family !== "aleo") return null;

  if (isPrivateTransaction(props.transaction) && nestedStep === "private-sync") {
    return <StepMandatoryPrivateSync {...props} />;
  }

  if (isPrivateTransaction(props.transaction) && nestedStep === "record-picker") {
    const account = props.account;
    const aleoAccount = account && "aleoResources" in account ? (account as AleoAccount) : null;

    if (!aleoAccount) {
      return null;
    }
    return <StepRecordPicker {...props} account={aleoAccount} transaction={props.transaction} />;
  }

  return <DefaultStepAmount {...props} />;
};

export default SendStepAmount;
