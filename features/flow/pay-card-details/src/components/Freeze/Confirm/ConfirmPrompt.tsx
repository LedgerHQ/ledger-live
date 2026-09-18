import React from "react";
import { ConfirmBody } from "./ConfirmBody";
import { freezeCopy } from "../freezeCopy";
import type { ConfirmPromptProps } from "../../../types";

export function ConfirmPrompt({ status, isPending, onConfirm, onClose }: ConfirmPromptProps) {
  const copy = freezeCopy(status);
  const isFrozen = status === "FROZEN";

  return (
    <ConfirmBody
      appearance="info"
      titleKey={copy.title}
      descriptionKey={isFrozen ? undefined : "payTab.card.freezeConfirm.description"}
      confirmLabelKey={copy.action}
      isPending={isPending}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
