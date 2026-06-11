import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { AssetHeader } from "./components/AssetHeader";
import { ActionBar } from "./components/ActionBar";
import { ChartSection } from "./components/ChartSection";
import { HiddenBanner } from "./components/HiddenBanner";
import { MarketPriceSection } from "./components/MarketPriceSection";
import { AddressListSection } from "./components/AddressList";
import { MarketDataSection } from "./components/MarketDataSection";
import { MetricsRowSection } from "./components/MetricsRowSection";
import { TotalBalance } from "./components/TotalBalance";
import { TransactionsSection } from "./components/TransactionsSection";
import type { AssetDetailReady } from "./types";
import { resolveAssetDetailSectionLoading } from "./utils/resolveAssetDetailSectionLoading";

type AssetDetailViewProps = Readonly<{
  viewModel: AssetDetailReady;
}>;

export function AssetDetailView({ viewModel }: AssetDetailViewProps) {
  const {
    distributionItem,
    marketData,
    displayTicker,
    ledgerId,
    ledgerIds,
    ledgerCurrency,
    isDistributionLoading,
    selectedRange,
    onRangeChange,
  } = viewModel;

  const { isLoading: isMarketLoading, marketCurrencyData } = marketData;
  const hasDistributionItem = distributionItem != null;
  const hasPortfolioAccounts = (distributionItem?.accounts.length ?? 0) > 0;
  const portfolioSectionLoading = resolveAssetDetailSectionLoading(
    isDistributionLoading,
    isMarketLoading,
    hasDistributionItem,
  );
  const showPortfolioSections = portfolioSectionLoading || hasPortfolioAccounts;
  const showMarketDataSection =
    marketCurrencyData != null || isDistributionLoading || isMarketLoading;

  return (
    <div className="flex w-full shrink-0 flex-col gap-24 pb-32">
      <AssetHeader
        assetTicker={displayTicker}
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

      {ledgerCurrency && <HiddenBanner currency={ledgerCurrency} />}

      <MarketPriceSection
        distributionItem={distributionItem}
        ledgerId={ledgerId}
        marketData={marketData}
        isDistributionLoading={isDistributionLoading}
        selectedRange={selectedRange}
      />

      <ActionBar
        distributionItem={distributionItem}
        ledgerCurrency={ledgerCurrency}
        ledgerIds={ledgerIds}
        marketCurrencyData={marketCurrencyData}
        tickerHint={displayTicker}
        isDistributionLoading={isDistributionLoading}
        isMarketLoading={isMarketLoading}
      />

      <ChartSection
        marketData={marketData}
        ledgerId={ledgerId}
        currencyId={ledgerCurrency?.id}
        isDistributionLoading={isDistributionLoading}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        distributionItem={distributionItem}
      />

      <div className="flex flex-col gap-32">
        {showPortfolioSections && (
          <TotalBalance distributionItem={distributionItem} isLoading={portfolioSectionLoading} />
        )}

        <MetricsRowSection
          distributionItem={distributionItem}
          ledgerCurrency={ledgerCurrency}
          isDistributionLoading={isDistributionLoading}
          isMarketLoading={isMarketLoading}
        />

        {showPortfolioSections && (
          <AddressListSection
            distributionItem={distributionItem}
            isLoading={portfolioSectionLoading}
          />
        )}

        {showMarketDataSection && (
          <MarketDataSection
            marketData={marketData}
            isDistributionLoading={isDistributionLoading}
            ledgerCurrencyId={ledgerCurrency?.id ?? ledgerId}
          />
        )}

        <TransactionsSection
          distributionItem={distributionItem}
          isLoading={portfolioSectionLoading}
        />
      </div>
    </div>
  );
}
