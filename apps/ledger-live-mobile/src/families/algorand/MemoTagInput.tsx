import React from "react";

import type { Transaction as AlgorandTransaction } from "@ledgerhq/live-common/families/algorand/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps) => (
  <GenericMemoTagInput<AlgorandTransaction>
    {...props}
    valueToTxPatch={value => ({ memo: value || undefined })}
  />
);
