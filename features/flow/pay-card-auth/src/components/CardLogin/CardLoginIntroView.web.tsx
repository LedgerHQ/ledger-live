import React, { useCallback } from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { CoinsAddPlus, CreditCard, LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import heroImage from "./payCardLoginIntro.webp";
import type { CardLoginIntroRowIcon, CardLoginIntroViewProps } from "./types";

const ROW_ICONS: Record<CardLoginIntroRowIcon, typeof CreditCard> = {
  CoinsAddPlus,
  CreditCard,
  LedgerLogo,
};

export function CardLoginIntroView({
  isOpen,
  title,
  providedBy,
  rows,
  actions,
  onActionPress,
  onClose,
}: CardLoginIntroViewProps) {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] p-0"
        data-testid="pay-card-login-intro-dialog"
      >
        <DialogHeader density="compact" onClose={onClose} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-16 overflow-hidden px-16 pb-24">
          <div
            className="scrollbar-none flex min-h-0 flex-1 flex-col gap-16 overflow-y-auto"
            data-testid="pay-card-login-intro-content"
          >
            <img
              src={heroImage}
              alt=""
              className="h-[192px] w-full rounded-xl object-cover"
              data-testid="pay-card-login-intro-hero"
              draggable={false}
            />
            <h2 className="heading-3-semi-bold text-base">{title}</h2>
            <div className="flex flex-col gap-16">
              {rows.map(row => {
                const RowIcon = ROW_ICONS[row.icon];
                return (
                  <div
                    key={row.icon}
                    className="flex items-center gap-12"
                    data-testid={`pay-card-login-intro-row-${row.icon}`}
                  >
                    {RowIcon ? <RowIcon size={24} className="shrink-0" /> : null}
                    <div className="flex min-w-0 flex-col gap-4">
                      <p className="body-2-semi-bold text-base">{row.title}</p>
                      <p className="body-3 text-muted">{row.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col items-center gap-16">
            <p
              className="text-center body-3 text-muted"
              data-testid="pay-card-login-intro-provided-by"
            >
              {providedBy}
            </p>
            {actions.map(action => (
              <Button
                key={action.id}
                appearance={action.appearance}
                size="lg"
                className="w-full"
                onClick={onActionPress}
                data-testid={`pay-card-login-intro-${action.id}`}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
