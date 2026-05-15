import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { AssetHeader } from "./components/AssetHeader";
import { ActionBar } from "./components/ActionBar";
import { MarketPriceSection } from "./components/MarketPriceSection";
import { MarketDataSection } from "./components/MarketDataSection";
import { PortfolioSection } from "./components/PortfolioSection/PortfolioSection";
import { TransactionsSection } from "./components/TransactionsSection";
import type { AssetDetailReady } from "./types";

type AssetDetailViewProps = Readonly<{
  viewModel: AssetDetailReady;
}>;

export function AssetDetailView({ viewModel }: AssetDetailViewProps) {
  const { distributionItem, marketInfo, market, assetName, assetTicker, ledgerId, ledgerCurrency } =
    viewModel;

  return (
    <div className="flex w-full shrink-0 flex-col gap-24 pb-32">
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
        distributionItem={distributionItem}
        market={market}
        marketInfo={marketInfo}
        ledgerCurrency={ledgerCurrency}
      />

      <MarketPriceSection
        distributionItem={distributionItem}
        marketInfo={marketInfo}
        ledgerId={ledgerId}
        market={market}
      />

      <ActionBar
        distributionItem={distributionItem}
        ledgerCurrency={ledgerCurrency}
        marketCurrencyData={market.marketCurrencyData}
        tickerHint={assetTicker}
      />

      <div className="flex flex-col gap-32">
        {distributionItem && <PortfolioSection distributionItem={distributionItem} />}

        {marketInfo && <MarketDataSection market={market} />}

        {distributionItem && <TransactionsSection distributionItem={distributionItem} />}
      </div>
    </div>
  );
}
