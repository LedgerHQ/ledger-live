import React from "react";
import { useTranslation } from "react-i18next";

import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/xrp/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "LLM/features/MemoTag/types";

export default MemoTagInput;

function MemoTagInput({ onChange, ...inputProps }: MemoTagInputProps<RippleTransaction>) {
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const value = text.replace(/\D/g, "");
    setValue(value);
    onChange({
      patch: { tag: value ? Number(value) : undefined },
      isEmpty: !value,
    });
  };

  return (
    <AnimatedInput
      {...inputProps}
      placeholder={t("send.summary.tag")}
      value={value}
      onChangeText={handleChange}
    />
  );
}
