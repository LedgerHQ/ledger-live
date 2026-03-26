import React from "react";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { StepProps } from "~/renderer/modals/Send/types";
import { SelfTransferStepRecipient } from "./SelfTransferModal/SelfTransferStepRecipient";
import { AleoSendStepRecipient } from "./SendTransferModal/AleoSendStepRecipient";

const SendStepRecipient = (props: StepProps) => {
  if (!props.transaction || props.transaction?.family !== "aleo") return null;

  if (isSelfTransferTransaction(props.transaction)) {
    return <SelfTransferStepRecipient {...props} />;
  }

  return <AleoSendStepRecipient {...props} />;
};

export default SendStepRecipient;
