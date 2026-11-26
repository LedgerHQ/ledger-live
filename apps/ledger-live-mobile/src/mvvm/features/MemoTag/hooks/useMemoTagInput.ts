import debounce from "lodash/debounce";
import { FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useFeature } from "@features/platform-feature-flags";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
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

  const [isDebouncePending, setIsDebouncePending] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const latestUpdateTransaction = useRef(updateTransaction);
  useLayoutEffect(() => {
    latestUpdateTransaction.current = updateTransaction;
  }, [updateTransaction]);

  const [debouncedUpdateTransaction] = useState(() =>
    debounce((patch: TxPatch<Transaction>) => {
      setIsDebouncePending(false);
      latestUpdateTransaction.current(patch);
    }, DEBOUNCE_DELAY),
  );
  useEffect(() => () => debouncedUpdateTransaction.cancel(), [debouncedUpdateTransaction]);

  const handleChange = useCallback<MemoTagInputProps["onChange"]>(
    ({ patch, value, error }) => {
      setIsDebouncePending(true);
      setIsEmpty(!value);
      setError(error);
      debouncedUpdateTransaction(patch);
    },
    [debouncedUpdateTransaction],
  );

  return Input && { Input, isEmpty, isDebouncePending, error, handleChange };
};

const DEBOUNCE_DELAY = 300;
