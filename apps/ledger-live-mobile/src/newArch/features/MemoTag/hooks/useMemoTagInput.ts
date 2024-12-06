import debounce from "lodash/debounce";
import { FC, useCallback, useMemo, useState } from "react";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import perFamily from "~/generated/MemoTagInput";
import { MemoTagInputProps, TxPatch } from "../types";

export const useMemoTagInput = (
  family: CryptoCurrency["family"],
  updateTransaction: (patch: TxPatch<Transaction>) => void,
) => {
  const featureMemoTag = useFeature("llmMemoTag");
  const Input =
    (featureMemoTag?.enabled &&
      (perFamily[family as keyof typeof perFamily] as FC<MemoTagInputProps>)) ||
    null;

  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const debouncedUpdateTransaction = useMemo(
    () => debounce(updateTransaction, DEBOUNCE_DELAY),
    [updateTransaction],
  );
  const handleChange = useCallback<MemoTagInputProps["onChange"]>(
    ({ patch, value, error }) => {
      setIsEmpty(!value);
      setError(error);
      debouncedUpdateTransaction(patch);
    },
    [debouncedUpdateTransaction],
  );

  return Input && { Input, isEmpty, error, handleChange };
};

const DEBOUNCE_DELAY = 300;
