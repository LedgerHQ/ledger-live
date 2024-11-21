import React from "react";

import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<StacksTransaction>) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);
