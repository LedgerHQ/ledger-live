import { FC, useCallback, useState } from "react";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import perFamily from "~/generated/MemoTagInput";
import { MemoTagInputProps } from "../types";

export const useMemoTagInput = (
  family: CryptoCurrency["family"],
  updateTransaction: (patch: Partial<Transaction>) => void,
) => {
  const featureMemoTag = useFeature("llmMemoTag");
  const Input: FC<MemoTagInputProps> | null =
    (featureMemoTag?.enabled &&
      family in perFamily &&
      perFamily[family as keyof typeof perFamily]) ||
    null;

  const [isEmpty, setIsEmpty] = useState(true);
  const handleChange = useCallback<MemoTagInputProps["onChange"]>(
    ({ patch, value }) => {
      setIsEmpty(!value);
      updateTransaction(patch);
    },
    [updateTransaction],
  );

  return Input && { Input, isEmpty, handleChange };
};
