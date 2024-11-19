import React from "react";

import type { Transaction as CosmosTransaction } from "@ledgerhq/live-common/families/cosmos/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps) => (
  <GenericMemoTagInput<CosmosTransaction>
    {...props}
    valueToTxPatch={value => ({ memo: value || undefined })}
  />
);
