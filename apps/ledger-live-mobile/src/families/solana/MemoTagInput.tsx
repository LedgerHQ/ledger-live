import React from "react";

import { Transaction as SolanaTransaction } from "@ledgerhq/live-common/generated/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps) => (
  <GenericMemoTagInput<SolanaTransaction>
    {...props}
    valueToTxPatch={value => ({ memo: value || undefined })}
  />
);
