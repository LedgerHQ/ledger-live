import React, { Suspense, useCallback, useState } from "react";
import { FeeSelectionSheet } from "./FeeSelectionSheet";
import type { FeeSelectionStepProps } from "./types";

export type { FeeSelectionStepProps } from "./types";

/**
 * The fee step of the Wallet API sign drawer, shown before the device step: the user picks a fee
 * preset or enters custom fees. The account bridge loads under Suspense, before the sheet opens.
 */
export function FeeSelectionStep(props: FeeSelectionStepProps) {
  const [isCustomFeesOpen, setIsCustomFeesOpen] = useState(false);
  const onOpenCustomFees = useCallback(() => setIsCustomFeesOpen(true), []);
  const onCloseCustomFees = useCallback(() => setIsCustomFeesOpen(false), []);

  return (
    <Suspense fallback={null}>
      <FeeSelectionSheet
        {...props}
        isCustomFeesOpen={isCustomFeesOpen}
        onOpenCustomFees={onOpenCustomFees}
        onCloseCustomFees={onCloseCustomFees}
      />
    </Suspense>
  );
}
