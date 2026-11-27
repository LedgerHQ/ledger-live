import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import type { StakePositionResultViewProps } from "./StakePositionResultView.types";

export function StakePositionResultView({
  preset,
  title,
  description,
  warning,
  cta,
  testID,
}: StakePositionResultViewProps) {
  return (
    <DialogBody>
      <InfoState
        preset={preset}
        size="hug"
        title={title}
        description={description}
        banner={warning ? { appearance: "warning", description: warning } : undefined}
        primaryCta={cta}
        testID={testID}
      />
    </DialogBody>
  );
}
