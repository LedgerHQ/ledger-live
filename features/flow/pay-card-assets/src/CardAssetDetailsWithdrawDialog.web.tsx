import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { InformationFill } from "@ledgerhq/lumen-ui-react/symbols";
import type { CardAssetDialogCopy } from "./types";

type CardAssetDetailsWithdrawDialogProps = Readonly<{
  isOpen: boolean;
  copy: CardAssetDialogCopy;
  onClose: () => void;
  onContinue: () => void;
}>;

export function CardAssetDetailsWithdrawDialog({
  isOpen,
  copy,
  onClose,
  onContinue,
}: CardAssetDetailsWithdrawDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="pb-24"
        data-testid="card-asset-withdraw-dialog"
        aria-describedby={undefined}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-muted"
        />
        <DialogHeader density="expanded" onClose={onClose} />
        <DialogBody className="flex flex-col items-center gap-32 px-24 pb-24 text-center">
          <div className="flex flex-col items-center gap-24">
            <Spot appearance="icon" icon={InformationFill} size={56} />
            <div className="flex flex-col gap-8">
              <span className="heading-4-semi-bold text-base">{copy.withdrawTitle}</span>
              <p className="body-2 text-muted">{copy.withdrawDescription}</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-8">
            <Button
              appearance="base"
              size="lg"
              isFull
              onClick={onContinue}
              data-testid="card-asset-withdraw-continue"
            >
              {copy.continue}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
