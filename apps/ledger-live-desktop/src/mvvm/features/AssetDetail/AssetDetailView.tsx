import React from "react";
import { AssetDetailSection } from "./components/AssetDetailSection";
import { useAssetDetailSections } from "./hooks/useAssetDetailSections";
import type { AssetDetailViewModel } from "./hooks/useAssetDetailViewModel";

export function AssetDetailView({ distributionItem }: Readonly<AssetDetailViewModel>) {
  const { topSections, sections, notFoundContent } = useAssetDetailSections(distributionItem);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-32">
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
