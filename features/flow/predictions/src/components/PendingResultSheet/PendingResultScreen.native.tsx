import React from "react";
import type { PendingResultSheetViewProps } from "./PendingResultSheetView.types";
import { PendingResultScreenView } from "./PendingResultScreenView";
import { usePendingResultScreenViewModel } from "./usePendingResultScreenViewModel";

/** On mobile, the pending result is a full screen rather than a sheet. */
export function PendingResultScreen({
  contentKey,
  testID,
  children,
  ...input
}: PendingResultSheetViewProps) {
  return (
    <PendingResultScreenView
      {...usePendingResultScreenViewModel({ ...input, contentKey })}
      contentKey={contentKey}
      testID={testID}
    >
      {children}
    </PendingResultScreenView>
  );
}
