import merge from "lodash/merge";
import React from "react";

import { Transaction as SolanaTransaction } from "@ledgerhq/live-common/families/solana/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<SolanaTransaction>) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx =>
      merge({}, tx, { model: { uiState: { memo: value || undefined } } })
    }
  />
);
