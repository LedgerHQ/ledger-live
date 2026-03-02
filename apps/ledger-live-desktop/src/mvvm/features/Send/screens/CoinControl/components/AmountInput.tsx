import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, TextInput } from "@ledgerhq/lumen-ui-react";

type AmountInputProps = Readonly<{
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  amount: string;
}>;

export const AmountInput = ({ onAmountChange, amount }: AmountInputProps) => {
  return (
    <div className="flex flex-col gap-12">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>Amount to send in BTC</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <TextInput label="Amount to send" onChange={onAmountChange} value={amount} type="string" />
    </div>
  );
};
