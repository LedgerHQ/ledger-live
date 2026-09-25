import React from "react";

import type { Transaction as CosmosTransaction } from "@ledgerhq/live-common/families/cosmos/types";
import { cosmosMemoPatch } from "@ledgerhq/live-common/bridge/descriptor/send/memo";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<CosmosTransaction>) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, ...cosmosMemoPatch(value) })}
  />
);
