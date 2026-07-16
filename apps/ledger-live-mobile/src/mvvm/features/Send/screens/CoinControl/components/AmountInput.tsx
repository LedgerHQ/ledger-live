import React from "react";
import { TextInput, Box } from "@ledgerhq/lumen-ui-rnative";

type AmountInputProps = Readonly<{
  onAmountChange: (text: string) => void;
  amount: string | null;
  errorMessage?: string | null;
  amountToSendLabel: string;
}>;

export const AmountInput = ({
  onAmountChange,
  amount,
  errorMessage,
  amountToSendLabel,
}: AmountInputProps) => {
  return (
    <Box lx={{ flexDirection: "column", gap: "s12", paddingHorizontal: "s8" }}>
      <TextInput
        label={amountToSendLabel}
        aria-label={amountToSendLabel}
        value={amount ?? ""}
        helperText={errorMessage ?? undefined}
        status={errorMessage ? "error" : undefined}
        onChangeText={onAmountChange}
      />
    </Box>
  );
};
