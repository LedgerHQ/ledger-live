import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { AssetDetailSection } from "./components/AssetDetailSection";
import { AssetHeader } from "./components/AssetHeader/AssetHeader";
import { TotalBalance } from "./components/PortfolioSection/TotalBalance";
import { useAssetDetailSections } from "./hooks/useAssetDetailSections";
import type { AssetDetailViewModel } from "./hooks/useAssetDetailViewModel";

export function AssetDetailView({ distributionItem }: Readonly<AssetDetailViewModel>) {
  const navigate = useNavigate();
  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const { topSections, sections, notFoundContent } = useAssetDetailSections(distributionItem);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-32">
      {distributionItem ? (
        <AssetHeader
          assetLabel={distributionItem.currency.name}
          icon={<CryptoCurrencyIcon currency={distributionItem.currency} size={24} />}
          onBack={onBack}
        />
      ) : null}

      {distributionItem ? <TotalBalance distributionItem={distributionItem} /> : null}

      <section className="grid grid-cols-2 gap-24">
        {topSections.map(section => (
          <AssetDetailSection
            key={section.id}
            title={section.title}
            actionLabel={section.actionLabel}
            actionHref={section.actionHref}
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
          actionHref={section.actionHref}
          tooltipContent={section.tooltipContent}
        >
          {section.content}
        </AssetDetailSection>
      ))}

      {distributionItem ? null : (
        <section className="rounded-16 border border-dashed border-neutral-c70/30 p-16 text-body text-neutral-c70">
          {notFoundContent}
        </section>
      )}
    </div>
  );
}
