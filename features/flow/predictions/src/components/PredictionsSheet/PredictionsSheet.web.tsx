import React from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { cn } from "@ledgerhq/lumen-utils-shared";
import { dismissPredictionsSheet, usePredictionsStep } from "../../predictionsSheetStore.internals";
import { AnimatedHeight, useAnimatedHeightCapped } from "@shared/ui-animated-height";
import { INTRO_TITLE_ID } from "./introTitleId";
import { SheetContent } from "./SheetContent";

function AnimatedStep({ children }: Readonly<{ children: React.ReactNode }>) {
  const isCapped = useAnimatedHeightCapped();

  return (
    <div
      className={cn(
        "flex animate-slide-in-from-right flex-col",
        isCapped && "scrollbar-custom min-h-0 flex-1 overflow-y-auto",
      )}
    >
      {children}
    </div>
  );
}

function handleOpenChange(isOpen: boolean) {
  if (!isOpen) dismissPredictionsSheet();
}

export function PredictionsSheet() {
  const { isOpen, shownStep } = usePredictionsStep();
  const stepType = shownStep?.step.type;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh]"
        // Only the consent step has a description for the dialog to point to.
        {...(stepType !== "consent" && { "aria-describedby": undefined })}
        // Lumen's DialogHeader always registers its own hidden title, empty for the intro.
        {...(stepType === "intro" && { "aria-labelledby": INTRO_TITLE_ID })}
        onInteractOutside={e => e.preventDefault()}
      >
        {shownStep ? (
          <AnimatedHeight>
            <AnimatedStep key={shownStep.key}>
              <SheetContent shownStep={shownStep} />
            </AnimatedStep>
          </AnimatedHeight>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
