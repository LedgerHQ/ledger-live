import React, { useEffect } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import type { PendingResultSheetViewProps } from "./PendingResultSheetView.types";

export function PendingResultSheetView({
  isOpen,
  contentKey,
  title,
  onPresented,
  onDismiss,
  testID,
  children,
}: PendingResultSheetViewProps) {
  // The dialog shows as soon as it opens, also when a new request replaces the open one.
  useEffect(() => {
    if (isOpen) onPresented();
  }, [isOpen, contentKey, onPresented]);
  const handleOpenChange = (nextIsOpen: boolean) => {
    if (!nextIsOpen) onDismiss();
  };

  return (
    <Dialog animated open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh]"
        aria-describedby={undefined}
        // Lumen's DialogHeader registers an empty hidden title: the dialog takes the content's title.
        aria-labelledby={undefined}
        aria-label={title}
        onInteractOutside={e => e.preventDefault()}
        data-testid={testID}
      >
        <DialogBackgroundToneProvider>
          <DialogHeader density="compact" className="mb-0" />
          <DialogBody className="mb-0 px-24">
            {contentKey === undefined ? null : (
              <div key={contentKey} className="flex animate-fade-in flex-col">
                {children}
              </div>
            )}
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
