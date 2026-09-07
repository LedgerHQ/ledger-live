import React, { useCallback, useEffect, useRef } from "react";
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
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import { BANK_TRANSFER_INTRO_HERO_IMAGE } from "./assets";
import type { BankTransferIntroViewProps } from "../../types";

export function BankTransferIntroView({
  isOpen,
  title,
  description,
  createAccountLabel,
  logInLabel,
  providedBy,
  rows,
  onShown,
  onCreateAccountPress,
  onLogInPress,
  onClosePress,
  onDismiss,
}: BankTransferIntroViewProps) {
  const acted = useRef(false);
  const shown = useRef(false);

  useEffect(() => {
    if (isOpen && !shown.current) {
      shown.current = true;
      acted.current = false;
      onShown();
    }
    if (!isOpen) {
      shown.current = false;
    }
  }, [isOpen, onShown]);

  const actOnce = useCallback((action: () => void) => {
    if (acted.current) {
      return;
    }
    acted.current = true;
    action();
  }, []);

  const handleCreateAccount = useCallback(() => {
    actOnce(onCreateAccountPress);
  }, [actOnce, onCreateAccountPress]);

  const handleLogIn = useCallback(() => {
    actOnce(onLogInPress);
  }, [actOnce, onLogInPress]);

  const handleClosePress = useCallback(() => {
    actOnce(onClosePress);
  }, [actOnce, onClosePress]);

  const handleDismiss = useCallback(() => {
    actOnce(onDismiss);
  }, [actOnce, onDismiss]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleDismiss();
    },
    [handleDismiss],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] bg-canvas-sheet p-0"
        data-testid="pay-bank-transfer-intro-dialog"
      >
        <DialogHeader density="expanded" onClose={handleClosePress} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden px-24">
          <div
            className="scrollbar-none flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto"
            data-testid="pay-bank-transfer-intro-content"
          >
            <img
              src={BANK_TRANSFER_INTRO_HERO_IMAGE}
              alt=""
              className="h-[192px] w-full rounded-xl object-cover"
              data-testid="pay-bank-transfer-intro-hero"
              draggable={false}
            />
            <div className="flex flex-col gap-8">
              <h2 className="heading-3-semi-bold text-base">{title}</h2>
              <p className="body-2 text-muted">{description}</p>
            </div>
            <div className="flex flex-col">
              {rows.map((row, index) => {
                const RowIcon = Icons[row.icon];
                return (
                  <ListItem
                    key={`${row.icon}-${index}`}
                    className="px-0"
                    data-testid={`pay-bank-transfer-intro-row-${row.icon}-${index}`}
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
          <div className="flex w-full shrink-0 flex-col items-center gap-16 pb-24">
            <p
              className="text-center body-3 text-muted"
              data-testid="pay-bank-transfer-intro-provided-by"
            >
              {providedBy}
            </p>
            <Button
              appearance="base"
              size="lg"
              className="w-full"
              onClick={handleCreateAccount}
              data-testid="pay-bank-transfer-intro-create-account"
            >
              {createAccountLabel}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              className="w-full"
              onClick={handleLogIn}
              data-testid="pay-bank-transfer-intro-log-in"
            >
              {logInLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
