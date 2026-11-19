import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import type { StakePositionSurfaceViewProps } from "./StakePositionSurfaceView.types";

function SurfaceHeader({
  title,
  isTitleInHeader,
  isDismissible,
}: Pick<StakePositionSurfaceViewProps, "title" | "isTitleInHeader" | "isDismissible">) {
  // Lumen exports no DialogTitle: a hidden header still names the dialog, and it hides the close
  // button.
  if (!isDismissible) return <DialogHeader hidden title={title} />;
  // The close button floats over the step, which leads with its own icon and title.
  if (!isTitleInHeader) return <DialogHeader density="compact" className="absolute right-0 z-10" />;
  return <DialogHeader density="expanded" title={title} />;
}

export function StakePositionSurfaceView({
  isOpen,
  title,
  isTitleInHeader,
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
  // The header holds no title then: the dialog is named after the title the step shows.
  const nameProps = isTitleInHeader ? {} : { "aria-label": title, "aria-labelledby": undefined };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        {...nameProps}
        onEscapeKeyDown={preventWhileLocked}
        onInteractOutside={preventWhileLocked}
        data-testid={testID}
      >
        {/* Draws the glow the confirmation and the results ask for. */}
        <DialogBackgroundToneProvider>
          <SurfaceHeader
            title={title}
            isTitleInHeader={isTitleInHeader}
            isDismissible={isDismissible}
          />
          {children}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
