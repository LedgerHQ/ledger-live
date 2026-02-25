import React from "react";
import { AmountInput, IconButton } from "@ledgerhq/lumen-ui-react";
import { TransferVertical } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import type { AmountScreenMessage } from "../types";
import { AmountMessageText } from "./AmountMessageText";

type AmountInputSectionProps = Readonly<{
  amountValue: string;
  amountInputMaxDecimalLength: number;
  currencyText: string;
  currencyPosition: "left" | "right";
  isInputDisabled: boolean;
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleInputMode: () => void;
  toggleLabel: string;
  secondaryValue: string;
  amountMessage: AmountScreenMessage | null | undefined;
}>;

export function AmountInputSection({
  amountValue,
  amountInputMaxDecimalLength,
  currencyText,
  currencyPosition,
  isInputDisabled,
  onAmountChange,
  onToggleInputMode,
  toggleLabel,
  secondaryValue,
  amountMessage,
}: AmountInputSectionProps) {
  return (
    <section className="relative flex flex-col items-center pt-56 text-center">
      <div className="relative flex w-full items-center justify-center">
        <AmountInput
          value={amountValue}
          placeholder="0"
          onChange={onAmountChange}
          maxDecimalLength={amountInputMaxDecimalLength}
          currencyText={currencyText}
          currencyPosition={currencyPosition}
          disabled={isInputDisabled}
          autoFocus
          aria-invalid={amountMessage?.type === "error"}
          className={cn(
            "heading-0-semi-bold text-base placeholder:text-muted",
            amountMessage?.type === "error" && "text-error",
          )}
        />
        <IconButton
          icon={TransferVertical}
          size="xs"
          appearance="gray"
          aria-label={toggleLabel}
          className="absolute top-12 right-8"
          onClick={onToggleInputMode}
        />
      </div>
      <p className="mt-8 body-2 text-muted">{secondaryValue}</p>
      <div className="mt-8 min-h-20">
        <AmountMessageText message={amountMessage} />
      </div>
    </section>
  );
}
