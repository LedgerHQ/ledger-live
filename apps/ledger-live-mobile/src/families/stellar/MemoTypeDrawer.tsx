import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

import type { StellarMemoType } from "@ledgerhq/live-common/families/stellar/types";
import { Icons, Text } from "@ledgerhq/native-ui";
import Circle from "~/components/Circle";
import QueuedDrawer from "~/components/QueuedDrawer";

export const MEMO_TYPES = new Map<MemoType, string>([
  ["NO_MEMO", "stellar.memoType.NO_MEMO"],
  ["MEMO_TEXT", "stellar.memoType.MEMO_TEXT"],
  ["MEMO_ID", "stellar.memoType.MEMO_ID"],
  ["MEMO_HASH", "stellar.memoType.MEMO_HASH"],
  ["MEMO_RETURN", "stellar.memoType.MEMO_RETURN"],
]);

type Props = {
  isOpen: boolean;
  closeModal: () => void;
  value: MemoType;
  onChange: (value: MemoType) => void;
};

export function MemoTypeDrawer({ isOpen, closeModal, value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <QueuedDrawer
      title={
        <Text variant="h4" textTransform="none">
          {t("send.summary.memo.type")}
        </Text>
      }
      isRequestingToBeOpened={isOpen}
      onClose={closeModal}
    >
      {Array.from(MEMO_TYPES).map(([type, label]) => (
        <Option
          key={type}
          label={t(label)}
          selected={type === value}
          onPress={() => onChange(type)}
        />
      ))}
    </QueuedDrawer>
  );
}

type OptionProps = TouchableOpacityProps & { label: string; selected?: boolean };
function Option({ label, selected = false, onPress }: OptionProps) {
  return (
    <TouchableOpacity
      style={{ padding: 16, display: "flex", flexDirection: "row", alignItems: "center" }}
      onPress={onPress}
    >
      <Text fontSize="body" fontWeight="semiBold" color={selected ? "primary.c80" : "neutral.c100"}>
        {label}
      </Text>
      {selected && (
        <Circle size={24} style={{ position: "absolute", right: 0 }}>
          <Icons.CheckmarkCircleFill size="M" color="primary.c80" />
        </Circle>
      )}
    </TouchableOpacity>
  );
}

type MemoType = (typeof StellarMemoType)[number];
