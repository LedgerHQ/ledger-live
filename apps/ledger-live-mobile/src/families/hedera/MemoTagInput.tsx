import React from "react";

import type { Transaction as HederaTransaction } from "@ledgerhq/live-common/families/hedera/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<HederaTransaction>) => (
  <GenericMemoTagInput
    {...props}
    // `memo` doesn't exist on the generic transaction this actually patches at runtime (LIVE-36154)
    // — the framework reads `memoType`/`memoValue`. `tx` is typed as the legacy `HederaTransaction`
    // here only because `MemoTagInputProps` is generic over it; the patch itself targets the real
    // fields.
    valueToTxPatch={value => tx =>
      ({ ...tx, memoType: "string", memoValue: value || undefined }) as unknown as HederaTransaction
    }
  />
);
