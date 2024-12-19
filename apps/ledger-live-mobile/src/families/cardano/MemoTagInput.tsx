import React from "react";

import type { Transaction as CardanoTransaction } from "@ledgerhq/live-common/families/cardano/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";
import { truncateUtf8 } from "LLM/utils/truncateUtf8";

export default (props: MemoTagInputProps<CardanoTransaction>) => (
  <GenericMemoTagInput
    {...props}
    textToValue={text => truncateUtf8(text, MAX_MEMO_LENGTH)}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);

// From the Cardano metadata documentation:
// > Strings must be at most 64 bytes when UTF-8 encoded.
// https://developers.cardano.org/docs/get-started/cardano-serialization-lib/transaction-metadata/#metadata-limitations
const MAX_MEMO_LENGTH = 64;
