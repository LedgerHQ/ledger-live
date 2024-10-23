import React from "react";

import type { Transaction as CryptoOrgTransaction } from "@ledgerhq/live-common/families/crypto_org/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps) => (
  <GenericMemoTagInput<CryptoOrgTransaction>
    {...props}
    valueToTxPatch={value => ({ memo: value || undefined })}
  />
);
