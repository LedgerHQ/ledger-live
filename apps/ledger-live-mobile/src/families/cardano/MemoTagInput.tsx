import React from "react";

import type { Transaction as CardanoTransaction } from "@ledgerhq/live-common/families/cardano/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<CardanoTransaction>) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);
