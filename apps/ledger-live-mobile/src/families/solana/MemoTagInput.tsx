import { setTransactionMemo } from "@ledgerhq/live-common/families/solana/transactions";
import merge from "lodash/merge";
import React from "react";

import { MAX_MEMO_LENGTH } from "@ledgerhq/live-common/families/solana/logic";
import type { Transaction as SolanaTransaction } from "@ledgerhq/live-common/families/solana/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<SolanaTransaction>) => (
  <GenericMemoTagInput
    {...props}
    maxByteLength={MAX_MEMO_LENGTH}
    valueToTxPatch={value => tx => merge({}, tx, setTransactionMemo(value ?? ""))}
  />
);
