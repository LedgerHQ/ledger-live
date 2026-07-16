import React from "react";
import { TextInput } from "@ledgerhq/lumen-ui-react";

type AmountInputProps = Readonly<{
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  amount: string | null;
  errorMessage?: string | null;
  amountInputLabel: string;
}>;

export const AmountInput = ({
  onAmountChange,
  amount,
  errorMessage,
  amountInputLabel,
}: AmountInputProps) => {
  return (
    <div className="flex flex-col gap-12">
      <TextInput
        label={amountInputLabel}
        aria-label={amountInputLabel}
        onChange={onAmountChange}
        value={amount ?? ""}
        type="text"
        helperText={errorMessage ?? undefined}
        status={errorMessage ? "error" : undefined}
      />
    </div>
  );
};
