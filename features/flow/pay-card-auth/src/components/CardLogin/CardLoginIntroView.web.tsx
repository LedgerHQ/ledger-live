import React, { useCallback } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { CoinsAddPlus, CreditCard, Nano } from "@ledgerhq/lumen-ui-react/symbols";
import heroImage from "./payCardLoginIntro.webp";
import type { CardLoginIntroRowIcon, CardLoginIntroViewProps } from "./types";

/** Static, so the row icon stays a name the type system checks and never a computed lookup. */
const ROW_ICONS: Record<CardLoginIntroRowIcon, typeof CreditCard> = {
  CoinsAddPlus,
  CreditCard,
  Nano,
};

/**
 * The intro the card holder sees on the first `Login` press. It draws and it reports, and nothing
 * more: `useCardLoginViewModel` owns how many logins a press may start.
 */
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
            <div className="flex flex-col">
              {rows.map(row => {
                const RowIcon = ROW_ICONS[row.icon];
                return (
                  <ListItem
                    key={row.icon}
                    className="px-0"
                    data-testid={`pay-card-login-intro-row-${row.icon}`}
                  >
                    <ListItemLeading className="p-0">
                      {RowIcon ? <RowIcon size={24} /> : null}
                      <ListItemContent>
                        <ListItemTitle>{row.title}</ListItemTitle>
                        <ListItemDescription>{row.description}</ListItemDescription>
                      </ListItemContent>
                    </ListItemLeading>
                  </ListItem>
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
