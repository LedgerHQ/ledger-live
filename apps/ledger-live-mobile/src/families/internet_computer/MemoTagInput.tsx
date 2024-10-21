import React from "react";

import { Transaction as ICPTransaction } from "@ledgerhq/live-common/families/internet_computer/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "LLM/features/MemoTag/types";

export default MemoTagInput;

function MemoTagInput({ onChange, ...inputProps }: MemoTagInputProps<ICPTransaction>) {
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const value = text.replace(/\D/g, "");
    setValue(value);
    onChange({
      patch: { memo: value || undefined },
      isEmpty: !value,
    });
  };

  return <AnimatedInput {...inputProps} value={value} onChangeText={handleChange} />;
}
