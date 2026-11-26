import React from "react";

import type { Transaction as CardanoTransaction } from "@ledgerhq/live-common/families/cardano/types";
import { CARDANO_MAX_MEMO_TAG_SIZE } from "@ledgerhq/live-common/families/cardano/logic";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<CardanoTransaction>) => (
  <GenericMemoTagInput
    {...props}
    maxByteLength={CARDANO_MAX_MEMO_TAG_SIZE}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);
