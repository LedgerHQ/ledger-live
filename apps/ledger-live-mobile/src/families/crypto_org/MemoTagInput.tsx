import React from "react";

import type { Transaction as CryptoOrgTransaction } from "@ledgerhq/live-common/families/crypto_org/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<CryptoOrgTransaction>) => (
  <GenericMemoTagInput
    {...props}
    valueToTxPatch={value => tx => ({ ...tx, memo: value || undefined })}
  />
);
