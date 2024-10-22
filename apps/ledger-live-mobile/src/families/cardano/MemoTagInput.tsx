import React from "react";

import type { Transaction as CardanoTransaction } from "@ledgerhq/live-common/families/cardano/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps) => (
  <GenericMemoTagInput<CardanoTransaction>
    {...props}
    valueToTxPatch={value => ({ memo: value || undefined })}
  />
);
