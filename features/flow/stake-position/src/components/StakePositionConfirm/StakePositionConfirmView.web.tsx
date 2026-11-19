import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import { Download } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import type { StakePositionConfirmViewProps } from "./StakePositionConfirmView.types";

// The `info` tone draws the muted glow of the design behind the icon.
export function StakePositionConfirmView({
  labels,
  errorContent,
  isPending,
  isConfirmDisabled,
  onConfirm,
  testID,
}: StakePositionConfirmViewProps) {
  return (
    <DialogBody>
      <InfoState
        preset="spot"
        spotProps={{ icon: Download }}
        backgroundTone="info"
        size="hug"
        title={labels.title}
        description={labels.description}
        banner={errorContent ? { appearance: "error", description: errorContent } : undefined}
        primaryCta={{
          label: labels.cta,
          onPress: onConfirm,
          loading: isPending,
          disabled: isConfirmDisabled,
        }}
        testID={testID}
      />
    </DialogBody>
  );
}
