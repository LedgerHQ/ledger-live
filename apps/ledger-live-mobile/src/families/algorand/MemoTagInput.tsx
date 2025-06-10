import React from "react";

import { ALGORAND_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/algorand/logic";
import type { Transaction as AlgorandTransaction } from "@ledgerhq/live-common/families/algorand/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const MemoTagInput = React.forwardRef<
  React.ComponentRef<typeof GenericMemoTagInput>,
  MemoTagInputProps<AlgorandTransaction>
>((props, ref) => (
  <GenericMemoTagInput
    {...props}
    maxLength={ALGORAND_MAX_MEMO_SIZE}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
    ref={ref}
  />
));

export default MemoTagInput;
