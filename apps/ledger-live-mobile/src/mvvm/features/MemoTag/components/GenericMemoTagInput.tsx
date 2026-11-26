import React from "react";

import { getMemoTooLongError } from "@ledgerhq/live-common/flows/send/recipient/utils/memoValue";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { MemoTagInputProps, TxPatch } from "../types";
import TextInput from "~/components/TextInput";

type Props<T extends Transaction = Transaction> = MemoTagInputProps<T> & {
  textToValue?: (text: string) => string;
  valueToTxPatch: (text: string) => TxPatch<T>;
  maxByteLength?: number;
};

export function GenericMemoTagInput<T extends Transaction>({
  onChange,
  valueToTxPatch,
  textToValue,
  maxByteLength,
  ...inputProps
}: Props<T>) {
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const value = textToValue?.(text) ?? text;
    const patch = valueToTxPatch(value);
    setValue(value);
    onChange({ value, patch, error: getMemoTooLongError({ value, maxLength: maxByteLength }) });
  };

  return (
    <TextInput {...inputProps} value={value} onChangeText={handleChange} testID="memo-tag-input" />
  );
}
