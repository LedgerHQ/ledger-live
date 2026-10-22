import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state/native";
import type { RemoveAccountContentViewProps } from "./types";

export function RemoveAccountContentView({
  labels,
  onConfirm,
  onCancel,
}: RemoveAccountContentViewProps) {
  return (
    <Box testID="account-settings-remove-content">
      <InfoState size="hug" preset="error" title={labels.title} description={labels.description} />
      <Box lx={{ paddingTop: "s8", gap: "s8" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          onPress={onConfirm}
          testID="account-settings-remove-confirm"
        >
          {labels.confirm}
        </Button>
        <Button
          appearance="no-background"
          size="lg"
          isFull
          onPress={onCancel}
          testID="account-settings-remove-cancel"
        >
          {labels.cancel}
        </Button>
      </Box>
    </Box>
  );
}
