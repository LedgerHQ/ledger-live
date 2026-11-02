import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { RemoveAccountContentViewProps } from "./types";

export function RemoveAccountContentView({
  labels,
  onConfirm,
  onCancel,
}: RemoveAccountContentViewProps) {
  return (
    <InfoState
      size="hug"
      preset="error"
      title={labels.title}
      description={labels.description}
      primaryCta={{
        label: labels.confirm,
        onPress: onConfirm,
        testID: "account-settings-remove-confirm",
      }}
      secondaryCta={{
        label: labels.cancel,
        onPress: onCancel,
        testID: "account-settings-remove-cancel",
      }}
      testID="account-settings-remove-content"
    />
  );
}
