import React from "react";
import { useTranslation } from "react-i18next";

import type { Transaction as CasperTransaction } from "@ledgerhq/live-common/families/casper/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const MemoTagInput = React.forwardRef<
  React.ComponentRef<typeof GenericMemoTagInput>,
  MemoTagInputProps<CasperTransaction>
>((props, ref) => {
  const { t } = useTranslation();
  return (
    <GenericMemoTagInput
      {...props}
      textToValue={text => text.replace(/\D/g, "")}
      valueToTxPatch={value => tx => ({ ...tx, transferId: value || undefined })}
      placeholder={t("send.summary.transferId")}
      ref={ref}
    />
  );
});

export default MemoTagInput;
