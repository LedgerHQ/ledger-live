import React from "react";

import type { Transaction as ConcordiumTransaction } from "@ledgerhq/live-common/families/concordium/types";
import { MAX_MEMO_LENGTH } from "@ledgerhq/coin-concordium/constants";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const MemoTagInput = (props: MemoTagInputProps<ConcordiumTransaction>) => (
  <GenericMemoTagInput
    {...props}
    maxByteLength={MAX_MEMO_LENGTH}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);

export default MemoTagInput;
