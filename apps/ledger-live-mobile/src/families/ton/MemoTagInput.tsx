import React from "react";
import { useTranslation } from "react-i18next";

import type { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps) => {
  const { t } = useTranslation();
  return (
    <GenericMemoTagInput<TonTransaction>
      {...props}
      valueToTxPatch={value =>
        value ? { comment: { isEncrypted: false, text: value } } : { comment: undefined }
      }
      placeholder={t("send.summary.comment")}
    />
  );
};
