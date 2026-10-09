import React from "react";

import { algorandMemoPatch } from "@ledgerhq/live-common/bridge/descriptor/send/memo";
import { ALGORAND_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/algorand/logic";
import type { AlgorandGenericTransaction } from "@ledgerhq/live-common/families/algorand/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<AlgorandGenericTransaction>) => (
  <GenericMemoTagInput
    {...props}
    maxLength={ALGORAND_MAX_MEMO_SIZE}
    valueToTxPatch={value => tx => ({ ...tx, ...algorandMemoPatch(value) })}
  />
);
