import React, { useCallback, useEffect, useRef } from "react";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import type { BankTransferIntroViewProps } from "../../types";

export function BankTransferIntroView({
  isOpen,
  title,
  description,
  continueLabel,
  rows,
  onShown,
  onContinuePress,
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

  const handleContinue = useCallback(() => {
    if (acted.current) {
      return;
    }
    acted.current = true;
    onContinuePress();
  }, [onContinuePress]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col gap-16" data-testid="pay-bank-transfer-intro-content">
      <div className="flex flex-col gap-8">
        <span className="heading-3-semi-bold text-base">{title}</span>
        <span className="body-2 text-muted">{description}</span>
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
      <Button
        appearance="base"
        size="lg"
        className="w-full"
        onClick={handleContinue}
        data-testid="pay-bank-transfer-intro-continue"
      >
        {continueLabel}
      </Button>
    </div>
  );
}
