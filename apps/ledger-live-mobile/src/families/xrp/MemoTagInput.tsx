import React from "react";
import { useTranslation } from "react-i18next";

import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/xrp/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

export default (props: MemoTagInputProps) => {
  const { t } = useTranslation();
  return (
    <GenericMemoTagInput<RippleTransaction>
      {...props}
      textToValue={text => text.replace(/\D/g, "")}
      valueToTxPatch={value => ({ tag: value ? Number(value) : undefined })}
      placeholder={t("send.summary.tag")}
    />
  );
};
