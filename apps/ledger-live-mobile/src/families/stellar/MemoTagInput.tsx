import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { AnimatedInputSelect } from "@ledgerhq/native-ui";
import { MemoTypeDrawer, MEMO_TYPES } from "./MemoTypeDrawer";

export default ({ onChange }: MemoTagInputProps<StellarTransaction>) => {
  const { t } = useTranslation();

  const [memoType, setMemoType] = useState<MemoType>("NO_MEMO");
  const [memoValue, setMemoValue] = React.useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleChangeType = (type: MemoType) => {
    const value = type === "NO_MEMO" ? "" : memoValue;

    setIsOpen(false);
    setMemoType(type);
    if (value !== memoValue) setMemoValue(value);

    onChange({ value, patch: { memoType: type, memoValue: value } });
  };

  const handleChangeValue = (value: string) => {
    const type = memoType === "NO_MEMO" && value ? "MEMO_TEXT" : memoType;

    setMemoValue(value);
    if (type !== memoType) setMemoType(type);

    onChange({ value, patch: { memoType: type, memoValue: value } });
  };

  return (
    <>
      <AnimatedInputSelect
        placeholder={t("send.summary.memo.value")}
        value={memoValue}
        onChange={handleChangeValue}
        selectProps={{
          text: t(MEMO_TYPES.get(memoType) ?? "send.summary.memo.type"),
          onPressSelect: () => setIsOpen(true),
        }}
      />

      <MemoTypeDrawer
        isOpen={isOpen}
        closeModal={() => setIsOpen(false)}
        value={memoType}
        onChange={handleChangeType}
      />
    </>
  );
};

type MemoType = Parameters<(typeof MEMO_TYPES)["get"]>[0];
