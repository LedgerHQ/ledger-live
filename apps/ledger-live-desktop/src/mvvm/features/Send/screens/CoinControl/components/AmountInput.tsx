import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, TextInput } from "@ledgerhq/lumen-ui-react";

type AmountInputProps = Readonly<{
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
    <div className="flex flex-col gap-12">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{amountToSendLabel}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <TextInput
        label={amountInputLabel}
        aria-label={amountInputLabel}
        onChange={onAmountChange}
        value={amount ?? ""}
        type="text"
        errorMessage={errorMessage ?? undefined}
      />
    </div>
  );
};
