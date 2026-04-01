import React from "react";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { StepProps } from "~/renderer/modals/Send/types";
import { DefaultStepAmount } from "~/renderer/modals/Send/steps/StepAmount";
import { StepRecordPicker } from "./shared/StepRecordPicker";

const SendStepAmount = (props: StepProps) => {
  if (!props.transaction || props.transaction?.family !== "aleo") return null;

  if (isPrivateTransaction(props.transaction)) {
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
