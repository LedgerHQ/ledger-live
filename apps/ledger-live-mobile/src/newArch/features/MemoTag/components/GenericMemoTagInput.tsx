import React from "react";

import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "../types";

type Props<T extends Transaction = Transaction> = MemoTagInputProps<T> & {
  textToValue?: (text: string) => string;
  valueToTxPatch: (text: string) => Partial<T>;
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

  return <AnimatedInput {...inputProps} value={value} onChangeText={handleChange} />;
}
