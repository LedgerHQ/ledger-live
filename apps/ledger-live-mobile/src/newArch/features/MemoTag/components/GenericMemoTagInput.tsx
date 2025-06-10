import React from "react";

import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import type { MemoTagInputProps, TxPatch } from "../types";

type Props<T extends Transaction = Transaction> = MemoTagInputProps<T> & {
  textToValue?: (text: string) => string;
  valueToTxPatch: (text: string) => TxPatch<T>;
};

type AnimatedInputRef = React.ComponentRef<typeof AnimatedInput>;

export const GenericMemoTagInput = React.forwardRef<AnimatedInputRef, Props>(
  <T extends Transaction>(props: Props<T>, ref: React.ForwardedRef<AnimatedInputRef>) => {
    const { onChange, valueToTxPatch, textToValue, ...inputProps } = props;
    const [value, setValue] = React.useState("");

    const handleChange = (text: string) => {
      const value = textToValue?.(text) ?? text;
      const patch = valueToTxPatch(value);
      setValue(value);
      onChange({ value, patch });
    };

    return (
      <AnimatedInput
        {...inputProps}
        value={value}
        onChangeText={handleChange}
        testID="memo-tag-input"
        ref={ref}
      />
    );
  },
);
