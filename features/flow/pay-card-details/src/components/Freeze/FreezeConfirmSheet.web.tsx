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
import { useTranslation } from "@shared/i18n";
import { freezeConfirmActionKey, freezeConfirmTitleKey } from "./freezeConfirmCopy";
import type { FreezeConfirmSheetProps } from "../../types";

export function FreezeConfirmSheet({
  isOpen,
  isFrozen,
  isLoading,
  onConfirm,
  onClose,
}: FreezeConfirmSheetProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="pb-24" data-testid="freeze-confirm-sheet">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-muted"
        />
        <DialogHeader density="compact" onClose={onClose} />
        <DialogBody
          className="flex flex-col items-center gap-32 px-24 pb-24 text-center"
          data-testid="freeze-confirm-sheet-content"
        >
          <div className="flex flex-col items-center gap-24">
            <Spot appearance="icon" icon={InformationFill} size={56} />
            <div className="flex flex-col gap-8">
              <span className="heading-4-semi-bold text-base">
                {t(freezeConfirmTitleKey(isFrozen))}
              </span>
              {!isFrozen ? (
                <p className="body-2 text-muted">{t("payTab.card.freezeConfirm.description")}</p>
              ) : null}
            </div>
          </div>
          <div className="flex w-full flex-col gap-8">
            <Button
              appearance="base"
              size="lg"
              isFull
              loading={isLoading}
              disabled={isLoading}
              onClick={onConfirm}
              data-testid="freeze-confirm-action"
            >
              {t(freezeConfirmActionKey(isFrozen))}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              isFull
              disabled={isLoading}
              onClick={onClose}
              data-testid="freeze-confirm-cancel"
            >
              {t("payTab.card.goBack")}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
