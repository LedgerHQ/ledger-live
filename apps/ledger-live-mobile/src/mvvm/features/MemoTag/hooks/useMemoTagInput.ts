import debounce from "lodash/debounce";
import { FC, useMemo, useState } from "react";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemoTagInput as useMemoTagInputFamily } from "~/families/hooks";
import { MemoTagInputProps, TxPatch } from "../types";

export const useMemoTagInput = (
  family: CryptoCurrency["family"],
  updateTransaction: (patch: TxPatch<Transaction>) => void,
) => {
  const featureMemoTag = useFeature("llmMemoTag");
  const familyMemoTagInput = useMemoTagInputFamily(featureMemoTag?.enabled ? family : undefined);
  const Input = (familyMemoTagInput as FC<MemoTagInputProps> | undefined) ?? null;

  const [isDebouncePending, setIsDebouncePending] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const handleChange = useMemo<MemoTagInputProps["onChange"]>(() => {
    const debouncedUpdateTransaction = debounce(patch => {
      setIsDebouncePending(false);
      updateTransaction(patch);
    }, DEBOUNCE_DELAY);
    return ({ patch, value, error }) => {
      setIsDebouncePending(true);
      setIsEmpty(!value);
      setError(error);
      debouncedUpdateTransaction(patch);
    };
  }, [updateTransaction]);

  return Input && { Input, isEmpty, isDebouncePending, error, handleChange };
};

const DEBOUNCE_DELAY = 300;
