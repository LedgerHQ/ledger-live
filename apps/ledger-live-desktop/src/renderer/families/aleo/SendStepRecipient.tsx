import React from "react";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { StepProps } from "~/renderer/modals/Send/types";
import { DefaultStepRecipient } from "~/renderer/modals/Send/steps/StepRecipient";
import { SelfTransferStepRecipient } from "./SelfTransferModal/SelfTransferStepRecipient";

const SendStepRecipient = (props: StepProps) => {
  if (!props.transaction || props.transaction?.family !== "aleo") return null;

  if (isSelfTransferTransaction(props.transaction)) {
    return <SelfTransferStepRecipient {...props} />;
  }

  return <DefaultStepRecipient {...props} />;
};

export default SendStepRecipient;
