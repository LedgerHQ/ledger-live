import React from "react";

import type { Transaction as CardanoTransaction } from "@ledgerhq/live-common/families/cardano/types";
import { CARDANO_MAX_MEMO_TAG_SIZE } from "@ledgerhq/live-common/families/cardano/logic";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";
import { truncateUtf8 } from "LLM/utils/truncateUtf8";

export default (props: MemoTagInputProps<CardanoTransaction>) => (
  <GenericMemoTagInput
    {...props}
    maxLength={CARDANO_MAX_MEMO_TAG_SIZE}
    textToValue={text => truncateUtf8(text, CARDANO_MAX_MEMO_TAG_SIZE)}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);
