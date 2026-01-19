import { FC, useMemo, useState } from "react";

import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import perFamily from "~/generated/ExpiryDurationInput";
import { ExpiryDurationInputProps, TxPatch } from "../types";

export const useExpiryDurationInput = (
  family: CryptoCurrency["family"],
  updateTransaction: (patch: TxPatch<Transaction>) => void,
) => {
  const familyModule = perFamily[family as keyof typeof perFamily];
  const Input = (familyModule as FC<ExpiryDurationInputProps> | undefined) ?? null;

  const [value, setValue] = useState<number | undefined>();
  const [error, setError] = useState<Error | undefined>();

  const handleChange = useMemo<ExpiryDurationInputProps["onChange"]>(() => {
    return ({ patch, value, error }) => {
      setValue(value);
      setError(error);
      updateTransaction(patch);
    };
  }, [updateTransaction]);

  if (!Input) return null;

  return { Input, value, error, handleChange };
};
