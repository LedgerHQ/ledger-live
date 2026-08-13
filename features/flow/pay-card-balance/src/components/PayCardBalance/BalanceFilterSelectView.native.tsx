import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { MediaButton } from "@ledgerhq/lumen-ui-rnative";
import type { BalanceFilterSelectViewModel } from "./useBalanceFilterSelectViewModel";

type BalanceFilterSelectViewProps = BalanceFilterSelectViewModel;

export function BalanceFilterSelectView({
  label,
  ledgerId,
  ticker,
  onPress,
}: BalanceFilterSelectViewProps) {
  const leadingContent =
    ledgerId != null ? (
      <CryptoIcon ledgerId={ledgerId} ticker={ticker ?? ""} size={24} />
    ) : undefined;

  return (
    <MediaButton
      size="sm"
      leadingContent={leadingContent}
      leadingContentShape="rounded"
      onPress={onPress}
      accessibilityLabel={label}
      testID="pay-card-balance-filter-pill"
    >
      {label}
    </MediaButton>
  );
}
