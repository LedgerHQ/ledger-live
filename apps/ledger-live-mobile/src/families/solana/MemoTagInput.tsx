import React from "react";

import { Transaction as SolanaTransaction } from "@ledgerhq/live-common/generated/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "LLM/features/MemoTag/types";

export default MemoTagInput;

function MemoTagInput({ onChange, ...inputProps }: MemoTagInputProps<SolanaTransaction>) {
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
