import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { MediaButton } from "@ledgerhq/lumen-ui-react";
import type { BalanceFilterOption } from "../../types";

type BalanceFilterPillProps = Readonly<{
  allStablecoinsLabel: string;
  selectedOption?: BalanceFilterOption;
  onClick: () => void;
}>;

export function BalanceFilterPill({
  allStablecoinsLabel,
  selectedOption,
  onClick,
}: BalanceFilterPillProps) {
  const label = selectedOption?.ticker ?? selectedOption?.title ?? allStablecoinsLabel;

  const leadingContent =
    selectedOption?.ledgerId != null ? (
      <CryptoIcon
        ledgerId={selectedOption.ledgerId}
        ticker={selectedOption.ticker ?? ""}
        size={24}
      />
    ) : undefined;

  return (
    <MediaButton
      size="sm"
      appearance="no-background"
      leadingContent={leadingContent}
      leadingContentShape="rounded"
      className="shrink-0"
      onClick={onClick}
      data-testid="pay-card-balance-filter-pill"
    >
      {label}
    </MediaButton>
  );
}
