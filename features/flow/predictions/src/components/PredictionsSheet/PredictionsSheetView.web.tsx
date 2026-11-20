import React from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { INTRO_TITLE_ID } from "./introTitleId";
import type { PredictionsSheetViewProps } from "./PredictionsSheet.types";
import { SheetContent } from "./SheetContent";

export function PredictionsSheetView({ isOpen, shownStep, onDismiss }: PredictionsSheetViewProps) {
  const stepType = shownStep?.step.type;
  const handleOpenChange = (nextIsOpen: boolean) => {
    if (!nextIsOpen) onDismiss();
  };

  return (
    <Dialog animated open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh]"
        // Only the consent step has a description for the dialog to point to.
        {...(stepType !== "consent" && { "aria-describedby": undefined })}
        // Lumen's DialogHeader always registers its own hidden title, empty for the intro.
        {...(stepType === "intro" && { "aria-labelledby": INTRO_TITLE_ID })}
        onInteractOutside={e => e.preventDefault()}
      >
        {shownStep ? (
          <div key={shownStep.key} className="flex min-h-0 animate-slide-in-from-right flex-col">
            <SheetContent shownStep={shownStep} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
