import React from "react";

import type { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "LLM/features/MemoTag/types";

export default MemoTagInput;

function MemoTagInput({ onChange, ...inputProps }: MemoTagInputProps<TonTransaction>) {
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const value = text;
    setValue(value);
    onChange({
      patch: value ? { comment: { isEncrypted: false, text } } : { comment: undefined },
      isEmpty: !value,
    });
  };

  return <AnimatedInput {...inputProps} value={value} onChangeText={handleChange} />;
}
