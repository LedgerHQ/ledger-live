import React from "react";

import type { HederaGenericTransaction } from "@ledgerhq/live-common/families/hedera/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<HederaGenericTransaction>) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, memoType: "string", memoValue: value || undefined })}
  />
);
