import React, { FC, memo, useRef } from "react";

import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import perFamily from "~/generated/MemoTagInput";
import { MemoTagInputProps } from "../types";

type Props = MemoTagInputProps<Transaction> & {
  family: CryptoCurrency["family"];
};

export const MemoTagInput = memo(({ family, ...props }: Props) => {
  const MemoTagInputRef = useRef(
    perFamily[family as keyof typeof perFamily] as FC<MemoTagInputProps<Transaction>>,
  );
  return <MemoTagInputRef.current {...props} />;
});
