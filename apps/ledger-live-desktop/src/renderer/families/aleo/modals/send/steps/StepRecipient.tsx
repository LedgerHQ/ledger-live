import React from "react";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { AleoSendStepRecipient } from "~/renderer/families/aleo/SendTransferModal/AleoSendStepRecipient";
import { SelfTransferStepRecipient } from "~/renderer/families/aleo/SelfTransferModal/SelfTransferStepRecipient";
import type { StepProps } from "~/renderer/modals/Send/types";

const StepRecipient = (props: StepProps) => {
  if (!props.transaction || props.transaction?.family !== "aleo") {
    return null;
  }

  if (isSelfTransferTransaction(props.transaction)) {
    return <SelfTransferStepRecipient {...props} />;
  }

  return <AleoSendStepRecipient {...props} />;
};

export default StepRecipient;
