import React from "react";

import { MAX_MEMO_VALUE } from "@ledgerhq/live-common/families/internet_computer/consts";
import type { Transaction as ICPTransaction } from "@ledgerhq/live-common/families/internet_computer/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<ICPTransaction>) => (
  <GenericMemoTagInput
    {...props}
    textToValue={text => {
      const value = Math.min(MAX_MEMO_VALUE, Number(text.replace(/\D/g, "")));
      return value ? String(value) : "";
    }}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);
