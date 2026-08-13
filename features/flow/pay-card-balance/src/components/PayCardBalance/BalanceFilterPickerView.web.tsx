import React, { useCallback } from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  Banner,
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Bundle } from "@ledgerhq/lumen-ui-react/symbols";
import type { BalanceFilterPickerViewProps } from "./types";

export function BalanceFilterPickerView({
  isOpen,
  draftFilter,
  options,
  labels,
  onClose,
  onSelectDraft,
  onConfirm,
}: BalanceFilterPickerViewProps) {
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
        <DialogHeader
          density="expanded"
          title={labels.filterDialogTitle}
          description={labels.filterDialogDescription}
          onClose={onClose}
        />
        <DialogBody className="flex flex-col gap-8">
          <div className="flex flex-col gap-8" data-testid="pay-card-balance-filter-picker">
            {options.map(option => {
              const selected = option.id === draftFilter;
              const rowKey = option.ticker?.toLowerCase() ?? "all";
              return (
                <Card
                  key={option.id}
                  type="interactive"
                  outlined={selected}
                  onClick={() => onSelectDraft(option.id)}
                  data-testid={`pay-card-balance-filter-option-${rowKey}`}
                >
                  <CardHeader>
                    <CardLeading>
                      {option.ledgerId != null ? (
                        <CryptoIcon
                          ledgerId={option.ledgerId}
                          ticker={option.ticker ?? ""}
                          size={48}
                        />
                      ) : (
                        <Spot appearance="icon" icon={Bundle} size={48} />
                      )}
                      <CardContent>
                        <CardContentTitle>{option.title}</CardContentTitle>
                        {option.ticker != null ? (
                          <CardContentDescription>{option.ticker}</CardContentDescription>
                        ) : null}
                      </CardContent>
                    </CardLeading>
                    <CardTrailing>
                      <div className="flex flex-col items-end gap-4">
                        <span className="body-2-semi-bold">{option.countervalueLabel}</span>
                        {option.cryptoAmountLabel != null ? (
                          <span className="body-3 text-muted">{option.cryptoAmountLabel}</span>
                        ) : null}
                      </div>
                    </CardTrailing>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
          <Banner appearance="info" title={labels.filterDialogBanner} />
        </DialogBody>
        <DialogFooter className="flex-col gap-16">
          <Button
            appearance="base"
            size="lg"
            className="w-full"
            onClick={onConfirm}
            data-testid="pay-card-balance-filter-confirm"
          >
            {labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
