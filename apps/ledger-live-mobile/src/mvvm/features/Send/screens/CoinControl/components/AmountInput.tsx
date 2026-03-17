import React from "react";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  TextInput,
  Box,
} from "@ledgerhq/lumen-ui-rnative";

type AmountInputProps = Readonly<{
  onAmountChange: (text: string) => void;
  amount: string | null;
  errorMessage?: string | null;
  amountToSendLabel: string;
  amountInputLabel: string;
}>;

export const AmountInput = ({
  onAmountChange,
  amount,
  errorMessage,
  amountToSendLabel,
  amountInputLabel,
}: AmountInputProps) => {
  return (
    <Box lx={{ flexDirection: "column", gap: "s12", paddingHorizontal: "s8" }}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{amountToSendLabel}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <TextInput
        label={amountInputLabel}
        aria-label={amountInputLabel}
        value={amount ?? ""}
        errorMessage={errorMessage ?? undefined}
        onChangeText={onAmountChange}
      />
    </Box>
  );
};
