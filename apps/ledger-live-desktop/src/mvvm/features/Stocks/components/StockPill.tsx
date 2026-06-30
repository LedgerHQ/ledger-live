import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { MediaButton } from "@ledgerhq/lumen-ui-react";
import { StockSuggestion } from "../types";
import type { AssetNavigationMarketState } from "LLD/features/Assets/types";

type StockPillProps = {
  stock: StockSuggestion;
  onClick: (currencyId: string, marketState?: AssetNavigationMarketState) => void;
};

export function StockPill({ stock, onClick }: Readonly<StockPillProps>) {
  const { name, ticker, ledgerId, navigationId } = stock;

  if (!ledgerId) return null;

  const leadingContent = <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={24} />;

  return (
    <MediaButton
      size="sm"
      hideChevron
      leadingContent={leadingContent}
      leadingContentShape="rounded"
      className="shrink-0"
      onClick={() => onClick(navigationId, { id: navigationId, ledgerIds: [ledgerId] })}
      aria-label={name}
      data-testid={`stock-item-ticker-${ticker.toLowerCase()}`}
    >
      {ticker.toUpperCase()}
    </MediaButton>
  );
}
