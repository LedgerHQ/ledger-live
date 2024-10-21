import React from "react";

import type { Transaction as HederaTransaction } from "@ledgerhq/live-common/families/hedera/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "LLM/features/MemoTag/types";

export default MemoTagInput;

function MemoTagInput({ onChange, ...inputProps }: MemoTagInputProps<HederaTransaction>) {
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const value = text;
    setValue(value);
    onChange({
      patch: { memo: value || undefined },
      isEmpty: !value,
    });
  };

  return <AnimatedInput {...inputProps} value={value} onChangeText={handleChange} />;
}
