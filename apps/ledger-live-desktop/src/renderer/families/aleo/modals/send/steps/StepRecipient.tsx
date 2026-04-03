import React from "react";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { AleoSendStepRecipient } from "~/renderer/families/aleo/SendTransferModal/AleoSendStepRecipient";
import { SelfTransferStepRecipient } from "~/renderer/families/aleo/SelfTransferModal/SelfTransferStepRecipient";
import type { StepProps } from "~/renderer/modals/Send/types";
import { useAccountChangeGuard } from "./useAccountChangeGuard";

const StepRecipient = (props: StepProps) => {
  const safeOnChangeAccount = useAccountChangeGuard(props.onChangeAccount, props.updateTransaction);

  if (!props.transaction || props.transaction?.family !== "aleo") {
    return null;
  }

  const patchedProps = { ...props, onChangeAccount: safeOnChangeAccount };

  if (isSelfTransferTransaction(props.transaction)) {
    return <SelfTransferStepRecipient {...patchedProps} />;
  }

  return <AleoSendStepRecipient {...patchedProps} />;
};

export default StepRecipient;
