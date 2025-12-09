import React from "react";

import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { MemoTagInputProps, TxPatch } from "../types";
import TextInput from "~/components/TextInput";

type Props<T extends Transaction = Transaction> = MemoTagInputProps<T> & {
  textToValue?: (text: string) => string;
  valueToTxPatch: (text: string) => TxPatch<T>;
};

export function GenericMemoTagInput<T extends Transaction>({
  onChange,
  valueToTxPatch,
  textToValue,
  ...inputProps
}: Props<T>) {
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const value = textToValue?.(text) ?? text;
    const patch = valueToTxPatch(value);
    setValue(value);
    onChange({ value, patch });
  };

  return (
    <>
      <Select onOpenChange={function PN() {}} onValueChange={function PN() {}} value="">
        <SelectTrigger label="Label" />
        <SelectContent>
          <SelectItem value="option1">
            <SelectItemText>Option 1</SelectItemText>
          </SelectItem>
          <SelectItem disabled textValue="Option 2 disabled" value="option2">
            <SelectItemText>Option 2 disabled</SelectItemText>
          </SelectItem>
          <SelectItem textValue="Option 3" value="option3">
            <SelectItemText>Option 3</SelectItemText>
          </SelectItem>
        </SelectContent>
      </Select>
      <TextInput
        {...inputProps}
        value={value}
        onChangeText={handleChange}
        testID="memo-tag-input"
      />
    </>
  );
}
