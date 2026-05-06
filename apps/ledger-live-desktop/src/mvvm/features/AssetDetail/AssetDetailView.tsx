import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { AssetDetailSection } from "./components/AssetDetailSection";
import { AssetHeader } from "./components/AssetHeader/AssetHeader";
import { AddressListSection } from "./components/AddressList";
import { TotalBalance } from "./components/PortfolioSection/TotalBalance";
import { useAssetDetailSections } from "./hooks/useAssetDetailSections";
import type { AssetDetailViewModel } from "./hooks/useAssetDetailViewModel";

export function AssetDetailView({ distributionItem }: Readonly<AssetDetailViewModel>) {
  const navigate = useNavigate();
  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const { topSections, sections } = useAssetDetailSections(distributionItem);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-32">
      <AssetHeader
        assetLabel={distributionItem.currency.name}
        icon={<CryptoCurrencyIcon currency={distributionItem.currency} size={24} />}
        onBack={onBack}
      />

      <TotalBalance distributionItem={distributionItem} />

      <AddressListSection distributionItem={distributionItem} />

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
    </div>
  );
}
