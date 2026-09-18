import React from "react";
import { ConfirmBody } from "./ConfirmBody";
import { freezeCopy } from "../freezeCopy";
import type { ConfirmErrorProps } from "../../../types";

export function ConfirmError({ status, onConfirm, onClose }: ConfirmErrorProps) {
  return (
    <ConfirmBody
      appearance="error"
      titleKey={freezeCopy(status).errorTitle}
      descriptionKey="payTab.card.confirmError.description"
      descriptionTestID="freeze-confirm-error"
      confirmLabelKey="payTab.card.confirmError.retry"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
