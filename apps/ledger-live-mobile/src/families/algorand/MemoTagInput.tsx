import React from "react";

import { ALGORAND_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/algorand/logic";
import type { Transaction as AlgorandTransaction } from "@ledgerhq/live-common/families/algorand/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<AlgorandTransaction>) => (
  <GenericMemoTagInput
    {...props}
    textToValue={text => text.slice(0, ALGORAND_MAX_MEMO_SIZE)}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);
