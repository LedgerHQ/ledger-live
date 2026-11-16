import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { StakePositionSurfaceViewProps } from "./StakePositionSurfaceView.types";

export function StakePositionSurfaceView({
  isOpen,
  title,
  onBack,
  onDismiss,
  isDismissible,
  children,
  testID,
}: StakePositionSurfaceViewProps) {
  const handleOpenChange = (nextIsOpen: boolean) => {
    if (!nextIsOpen && isDismissible) onDismiss();
  };
  const preventWhileLocked = (event: Event) => {
    if (!isDismissible) event.preventDefault();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        onEscapeKeyDown={preventWhileLocked}
        onInteractOutside={preventWhileLocked}
        data-testid={testID}
      >
        {isDismissible ? (
          <DialogHeader title={title} onBack={onBack} />
        ) : (
          // Lumen exports no DialogTitle: a hidden header still names the dialog, and it hides
          // the close button.
          <DialogHeader hidden title={title} />
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
