import React from "react";

import type { Transaction as CantonTransaction } from "@ledgerhq/live-common/families/canton/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const MemoTagInput = (props: MemoTagInputProps<CantonTransaction>) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);

export default MemoTagInput;
