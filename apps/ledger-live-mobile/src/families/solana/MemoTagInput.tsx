import merge from "lodash/merge";
import React from "react";

import { MAX_MEMO_LENGTH } from "@ledgerhq/live-common/families/solana/logic";
import type { Transaction as SolanaTransaction } from "@ledgerhq/live-common/families/solana/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";
import { truncateUtf8 } from "LLM/utils/truncateUtf8";

export default (props: MemoTagInputProps<SolanaTransaction>) => (
  <GenericMemoTagInput
    {...props}
    textToValue={text => truncateUtf8(text, MAX_MEMO_LENGTH)}
    valueToTxPatch={value => tx =>
      merge({}, tx, { model: { uiState: { memo: value || undefined } } })
    }
  />
);
