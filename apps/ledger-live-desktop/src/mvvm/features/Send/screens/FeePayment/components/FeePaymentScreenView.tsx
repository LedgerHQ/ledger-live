import React from "react";
import {
  DialogBody,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import type { FeePaymentOption, FeePaymentOptionId } from "../hooks/useFeePaymentViewModel";

type FeePaymentScreenViewProps = Readonly<{
  options: readonly FeePaymentOption[];
  disclaimer: string;
  onSelect: (id: FeePaymentOptionId) => void;
}>;

export function FeePaymentScreenView({ options, disclaimer, onSelect }: FeePaymentScreenViewProps) {
  return (
    <DialogBody className="gap-8 -mt-12 pt-2" data-testid="send-fee-payment-options">
      <div className="flex flex-col">
        {options.map(option => (
          <ListItem
            key={option.id}
            className="cursor-pointer"
            onClick={() => onSelect(option.id)}
            data-testid={`send-fee-payment-option-${option.id}`}
          >
            <ListItemLeading>
              <ListItemContent>
                <ListItemTitle>{option.label}</ListItemTitle>
                {option.savingsLabel ? (
                  <ListItemDescription>{option.savingsLabel}</ListItemDescription>
                ) : null}
              </ListItemContent>
            </ListItemLeading>
            {option.selected ? (
              <ListItemTrailing>
                <Check size={16} />
              </ListItemTrailing>
            ) : null}
          </ListItem>
        ))}
      </div>
      <p className="m-0 body-3 text-muted">{disclaimer}</p>
    </DialogBody>
  );
}
