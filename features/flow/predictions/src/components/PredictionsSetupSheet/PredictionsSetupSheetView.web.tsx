import React, { useEffect } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { AnimatedHeight } from "@shared/ui-animated-height";
import { useTranslation } from "@shared/i18n";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import type { PredictionsSetupSheetViewProps } from "./PredictionsSetupSheet.types";
import { SetupContent } from "./SetupContent";
import { setupTitleKey } from "./setupTitleKey";

export function PredictionsSetupSheetView({
  isOpen,
  shownSetup,
  onPresented,
  onDismiss,
}: PredictionsSetupSheetViewProps) {
  const { t } = useTranslation();
  const shownSetupKey = shownSetup?.key;

  // The dialog shows as soon as it opens, also when a new setup replaces the open one.
  useEffect(() => {
    if (isOpen) onPresented();
  }, [isOpen, shownSetupKey, onPresented]);
  const handleOpenChange = (nextIsOpen: boolean) => {
    if (!nextIsOpen) onDismiss();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh]"
        aria-describedby={undefined}
        // Lumen's DialogHeader registers an empty hidden title: the dialog takes the setup's title.
        aria-labelledby={undefined}
        aria-label={shownSetup ? t(setupTitleKey(shownSetup.outcome)) : undefined}
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogBackgroundToneProvider>
          <DialogHeader density="compact" className="mb-0" />
          <DialogBody className="mb-0 px-24">
            {shownSetup ? (
              <AnimatedHeight>
                <div key={shownSetup.key} className="flex animate-fade-in flex-col">
                  <SetupContent outcome={shownSetup.outcome} onDismiss={onDismiss} />
                </div>
              </AnimatedHeight>
            ) : null}
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
