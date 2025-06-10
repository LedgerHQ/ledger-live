import React from "react";

import type { Transaction as CosmosTransaction } from "@ledgerhq/live-common/families/cosmos/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const MemoTagInput = React.forwardRef<
  React.ComponentRef<typeof GenericMemoTagInput>,
  MemoTagInputProps<CosmosTransaction>
>((props, ref) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
    ref={ref}
  />
));

export default MemoTagInput;
