import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { AssetHeader } from "./components/AssetHeader/AssetHeader";
import { MarketDataSection } from "./components/MarketDataSection";
import { PortfolioSection } from "./components/PortfolioSection/PortfolioSection";
import { TransactionsSection } from "./components/TransactionsSection";
import type { AssetDetailReady } from "./types";

type AssetDetailViewProps = Readonly<{
  viewModel: AssetDetailReady;
}>;

export function AssetDetailView({ viewModel }: AssetDetailViewProps) {
  const navigate = useNavigate();
  const { distributionItem, marketInfo, assetName, assetTicker, ledgerId } = viewModel;

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="flex w-full shrink-0 flex-col gap-32 pb-32">
      <AssetHeader
        assetLabel={assetName}
        icon={
          ledgerId && (
            <CryptoIcon
              ledgerId={ledgerId}
              ticker={assetTicker}
              size={getValidCryptoIconSize(24)}
            />
          )
        }
        onBack={onBack}
      />

      {distributionItem && <PortfolioSection distributionItem={distributionItem} />}

      {marketInfo && <MarketDataSection currencyQueryId={viewModel.marketCurrencyQueryId} />}

      {distributionItem && <TransactionsSection distributionItem={distributionItem} />}
    </div>
  );
}
