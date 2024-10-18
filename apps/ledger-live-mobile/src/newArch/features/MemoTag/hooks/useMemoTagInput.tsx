import React, { useMemo, useState } from "react";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import perFamily from "~/generated/MemoTagInput";
import { MemoTagInput } from "../components/MemoTagInput";

export const useMemoTagInput = (
  family: CryptoCurrency["family"],
  updateTransaction: (patch: Partial<Transaction>) => void,
) => {
  const [isMemoTagSet, setIsMemoTagSet] = useState(false);

  const featureMemoTag = useFeature("llmMemoTag");
  const memoTagInput = useMemo(() => {
    const hasMemoTag = family in perFamily;
    if (!featureMemoTag || !hasMemoTag) return null;
    return (
      <MemoTagInput
        family={family as keyof typeof perFamily}
        style={{ marginTop: 32 }}
        onChange={({ patch, isMemoTagSet }) => {
          setIsMemoTagSet(isMemoTagSet);
          updateTransaction(patch);
        }}
      />
    );
  }, [featureMemoTag, family, updateTransaction]);

  return { memoTagInput, isMemoTagSet };
};
