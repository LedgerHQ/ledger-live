import React from "react";

import { stacksMemoPatch } from "@ledgerhq/live-common/bridge/descriptor/send/memo";
import { STACKS_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/stacks/constants";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<StacksTransaction>) => (
  <GenericMemoTagInput
    {...props}
    maxByteLength={STACKS_MAX_MEMO_SIZE}
    valueToTxPatch={value => tx => ({ ...tx, ...stacksMemoPatch(value) })}
  />
);
