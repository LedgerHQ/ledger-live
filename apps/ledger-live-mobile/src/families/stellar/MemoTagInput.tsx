import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { isMemoValid } from "@ledgerhq/live-common/families/stellar/bridge/logic";
import {
  StellarWrongMemoFormat,
  type Transaction as StellarTransaction,
} from "@ledgerhq/live-common/families/stellar/types";
import { AnimatedInputSelect } from "@ledgerhq/native-ui";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { MemoTypeDrawer, MEMO_TYPES } from "./MemoTypeDrawer";

export default ({ onChange, ...inputProps }: MemoTagInputProps<StellarTransaction>) => {
  const { t } = useTranslation();

  const [memoType, setMemoType] = useState<MemoType>("NO_MEMO");
  const [memoValue, setMemoValue] = React.useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (type: MemoType, value: string) => {
    const error = !value || isMemoValid(type, value) ? undefined : new StellarWrongMemoFormat();
    const memoType = !value ? "NO_MEMO" : type;
    const patch = (tx: StellarTransaction) => ({ ...tx, memoType, memoValue: value });
    onChange({ value, patch, error });
  };

  const handleChangeType = (type: MemoType) => {
    const value = type === "NO_MEMO" ? "" : memoValue;
    handleChange(type, value);

    setMemoType(type);
    if (value !== memoValue) setMemoValue(value);
    setIsOpen(false);
  };

  const handleChangeValue = (value: string) => {
    const type = memoType === "NO_MEMO" && value ? "MEMO_TEXT" : memoType;
    handleChange(type, value);

    setMemoValue(value);
    if (type !== memoType) setMemoType(type);
  };

  return (
    <>
      <AnimatedInputSelect
        {...inputProps}
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
