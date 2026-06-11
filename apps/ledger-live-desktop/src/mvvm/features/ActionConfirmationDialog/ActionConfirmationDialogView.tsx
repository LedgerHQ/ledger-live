import React from "react";
import { Dialog, DialogContent, DialogHeader, Spot, Button } from "@ledgerhq/lumen-ui-react";
import type { ActionConfirmationDialogViewProps } from "./useActionConfirmationDialogViewModel";

const SPOT_APPEARANCE = {
  info: "info",
  warning: "warning",
  success: "check",
} as const;

const ActionConfirmationDialogView = ({
  isOpen,
  title,
  description,
  ctaLabel,
  icon,
  onConfirm,
  onDismiss,
}: ActionConfirmationDialogViewProps) => {
  const spotAppearance = SPOT_APPEARANCE[icon] ?? "info";

  const handleOpenChange = (open: boolean) => {
    if (!open) onDismiss();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-canvas rounded-2xl overflow-hidden pb-0">
        <DialogHeader density="compact" onClose={onDismiss} className="absolute right-0 z-10" />
        <div className="relative flex flex-col items-center gap-32 overflow-hidden px-16 pb-24 pt-64">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-muted" />
          <div className="flex w-full flex-col items-center gap-24">
            <Spot appearance={spotAppearance} size={72} />
            <div className="flex flex-col items-center gap-8 text-center">
              <h3 className="heading-4-semi-bold text-base">{title}</h3>
              <p className="body-2 text-muted">{description}</p>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-16">
            <Button appearance="base" size="lg" className="w-full" onClick={onConfirm}>
              {ctaLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActionConfirmationDialogView;
