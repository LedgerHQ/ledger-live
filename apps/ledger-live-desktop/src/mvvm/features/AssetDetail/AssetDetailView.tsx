import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { AssetDetailSection } from "./components/AssetDetailSection";
import { AssetHeader } from "./components/AssetHeader/AssetHeader";
import { AddressListSection } from "./components/AddressList";
import { TotalBalance } from "./components/PortfolioSection/TotalBalance";
import { useAssetDetailSections } from "./hooks/useAssetDetailSections";
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

  const { topSections, sections } = useAssetDetailSections();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-32">
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

      {distributionItem && (
        <>
          <TotalBalance distributionItem={distributionItem} />
          <AddressListSection distributionItem={distributionItem} />
        </>
      )}

      {marketInfo && (
        <>
          <section className="grid grid-cols-2 gap-24">
            {topSections.map(section => (
              <AssetDetailSection
                key={section.id}
                title={section.title}
                actionLabel={section.actionLabel}
                onActionClick={section.onActionClick}
                tooltipContent={section.tooltipContent}
              >
                {section.content}
              </AssetDetailSection>
            ))}
          </section>

          {sections.map(section => (
            <AssetDetailSection
              key={section.id}
              title={section.title}
              actionLabel={section.actionLabel}
              onActionClick={section.onActionClick}
              tooltipContent={section.tooltipContent}
            >
              {section.content}
            </AssetDetailSection>
          ))}

          <div className="text-white p-16 rounded-16">
            <h1>Market</h1>
            <p>{marketInfo.id}</p>
            <p>{marketInfo.price}</p>
            <p>{marketInfo.ledgerIds[0]}</p>
          </div>
        </>
      )}
    </div>
  );
}
