import React from "react";
import { useTranslation } from "react-i18next";

import type { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps<TonTransaction>) => {
  const { t } = useTranslation();
  return (
    <GenericMemoTagInput
      {...props}
      valueToTxPatch={value => tx => ({ ...tx, comment: { isEncrypted: false, text: value } })}
      placeholder={t("send.summary.comment")}
    />
  );
};
