import React from "react";

import type { Transaction as HederaTransaction } from "@ledgerhq/live-common/families/hedera/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<HederaTransaction>) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);
