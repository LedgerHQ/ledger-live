import React, { useCallback } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { ShieldLock } from "@ledgerhq/lumen-ui-react/symbols";

type DialogIcon = typeof ShieldLock;

type VerifyAddressDialogProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  contentTestId: string;
  icon: DialogIcon;
  title: string;
  description?: string;
  ctaLabel: string;
  onCta: () => void;
  ctaTestId: string;
  children?: React.ReactNode;
}>;

export function VerifyAddressDialog({
  isOpen,
  onClose,
  contentTestId,
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  ctaTestId,
  children,
}: VerifyAddressDialogProps) {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-muted"
        />
        <DialogHeader density="compact" onClose={onClose} />
        <DialogBody className="flex flex-col gap-24" data-testid={contentTestId}>
          <div className="flex flex-col items-center gap-12 text-center">
            <Spot appearance="icon" icon={icon} size={56} />
            <h2 className="heading-4-semi-bold text-base">{title}</h2>
            {description ? <p className="body-2 text-muted">{description}</p> : null}
          </div>
          {children}
          <Button appearance="base" isFull onClick={onCta} data-testid={ctaTestId}>
            {ctaLabel}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
