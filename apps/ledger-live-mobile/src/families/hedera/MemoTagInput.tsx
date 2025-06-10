import React from "react";

import type { Transaction as HederaTransaction } from "@ledgerhq/live-common/families/hedera/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const MemoTagInput = React.forwardRef<
  React.ComponentRef<typeof GenericMemoTagInput>,
  MemoTagInputProps<HederaTransaction>
>((props, ref) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
    ref={ref}
  />
));

export default MemoTagInput;
