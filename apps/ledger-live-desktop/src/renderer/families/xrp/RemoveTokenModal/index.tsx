import React, { useState } from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import Modal from "~/renderer/components/Modal";
import Body from "../AddTokenModal/Body";
import { LOCKED_STEPS, StepId } from "../AddTokenModal/types";

export type Data = {
  account: Account;
  tokenAccount: TokenAccount;
};

export default function RemoveTokenModal() {
  const [stepId, setStepId] = useState<StepId>("review");

  return (
    <Modal
      name="MODAL_XRP_REMOVE_TOKEN"
      centered
      onHide={() => setStepId("review")}
      preventBackdropClick={LOCKED_STEPS.has(stepId)}
      render={({ onClose, data }) => (
        <Body
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={setStepId}
          params={{ ...data, remove: true }}
        />
      )}
    />
  );
}
