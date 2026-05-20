import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { AssetHeader } from "./components/AssetHeader";
import { ActionBar } from "./components/ActionBar";
import { MarketPriceSection } from "./components/MarketPriceSection";
import { MarketDataSection } from "./components/MarketDataSection";
import { PortfolioSection } from "./components/PortfolioSection/PortfolioSection";
import { StakingSection } from "./components/StakingSection";
import { TransactionsSection } from "./components/TransactionsSection";
import type { AssetDetailReady } from "./types";
import { PnLSection } from "./components/PnL";

type AssetDetailViewProps = Readonly<{
  viewModel: AssetDetailReady;
}>;

export function AssetDetailView({ viewModel }: AssetDetailViewProps) {
  const { distributionItem, marketData, displayName, displayTicker, ledgerId, ledgerCurrency } =
    viewModel;

  return (
    <div className="flex w-full shrink-0 flex-col gap-24 pb-32">
      <AssetHeader
        assetLabel={displayName}
        icon={
          ledgerId && (
            <CryptoIcon
              ledgerId={ledgerId}
              ticker={displayTicker}
              size={getValidCryptoIconSize(24)}
            />
          )
        }
        distributionItem={distributionItem}
        marketData={marketData}
        ledgerCurrency={ledgerCurrency}
      />

      <MarketPriceSection
        distributionItem={distributionItem}
        ledgerId={ledgerId}
        marketData={marketData}
      />

      <ActionBar
        distributionItem={distributionItem}
        ledgerCurrency={ledgerCurrency}
        marketCurrencyData={marketData.marketCurrencyData}
        tickerHint={displayTicker}
      />

      <div className="flex flex-col gap-32">
        {distributionItem && <PortfolioSection distributionItem={distributionItem} />}

        {distributionItem && <PnLSection distributionItem={distributionItem} />}

        {distributionItem && <StakingSection distributionItem={distributionItem} />}

        {marketData.marketCurrencyData && <MarketDataSection marketData={marketData} />}

        {distributionItem && <TransactionsSection distributionItem={distributionItem} />}
      </div>
    </div>
  );
}
