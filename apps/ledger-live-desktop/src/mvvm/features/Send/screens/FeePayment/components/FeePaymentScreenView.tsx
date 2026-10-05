import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentRow,
  CardContentTitle,
  CardFooter,
  CardHeader,
  CardLeading,
  CardTrailing,
  DialogBody,
  DialogFooter,
} from "@ledgerhq/lumen-ui-react";
import type { FeePaymentOption } from "../hooks/useFeePaymentViewModel";

type FeePaymentScreenViewProps = Readonly<{
  options: readonly FeePaymentOption[];
  disclaimer: string;
  confirmLabel: string;
  confirmDisabled: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
}>;

export function FeePaymentScreenView({
  options,
  disclaimer,
  confirmLabel,
  confirmDisabled,
  onSelect,
  onConfirm,
}: FeePaymentScreenViewProps) {
  return (
    <>
      <DialogBody className="gap-12 -mt-12 pt-2" data-testid="send-fee-payment-options">
        {options.map(option => (
          <Card
            key={option.id}
            type="interactive"
            outlined={option.selected}
            disabled={option.disabled}
            onClick={() => onSelect(option.id)}
            aria-pressed={option.selected}
            data-testid={`send-fee-payment-option-${option.id}`}
          >
            <CardHeader>
              <CardLeading>
                <CardContent>
                  <CardContentTitle>{option.label}</CardContentTitle>
                  <CardContentDescription>{option.paidInLabel}</CardContentDescription>
                </CardContent>
              </CardLeading>
              {option.fee ? (
                <CardTrailing>
                  <CardContent data-testid={`send-fee-payment-option-${option.id}-fee`}>
                    <CardContentRow className="gap-4">
                      {option.fee.originalValue ? (
                        <span
                          className="body-2 text-muted line-through"
                          data-testid={`send-fee-payment-option-${option.id}-original-fee`}
                        >
                          {option.fee.originalValue}
                        </span>
                      ) : null}
                      <CardContentTitle>{option.fee.value}</CardContentTitle>
                    </CardContentRow>
                    {option.fee.secondaryValue ? (
                      <CardContentDescription>{option.fee.secondaryValue}</CardContentDescription>
                    ) : null}
                  </CardContent>
                </CardTrailing>
              ) : null}
            </CardHeader>
            {option.note ? (
              <CardFooter appearance="no-background" className="pt-0">
                <p
                  className="m-0 body-3 text-muted"
                  data-testid={`send-fee-payment-option-${option.id}-note`}
                >
                  {option.note}
                </p>
              </CardFooter>
            ) : null}
          </Card>
        ))}
        <p className="m-0 body-3 text-muted" data-testid="send-fee-payment-disclaimer">
          {disclaimer}
        </p>
      </DialogBody>
      <DialogFooter className="flex flex-col">
        <Button
          appearance="base"
          size="lg"
          isFull
          disabled={confirmDisabled}
          onClick={onConfirm}
          data-testid="send-fee-payment-confirm"
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
