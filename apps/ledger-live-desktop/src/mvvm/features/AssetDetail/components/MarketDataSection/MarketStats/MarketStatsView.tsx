import React from "react";
import { SectionHeader } from "../../SectionHeader";
import { StatRow } from "../components/StatRow";
import type { MarketStatsViewModelResult } from "./hooks/useMarketStatsViewModel";

type Props = Readonly<MarketStatsViewModelResult>;

export function MarketStatsView({ rows, showSkeleton, sectionTitle, sectionTooltip }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-16">
      <SectionHeader title={sectionTitle} tooltipContent={sectionTooltip} />
      <div className="text-body">
        {showSkeleton ? (
          <div className="flex flex-col gap-8 pt-8">
            {rows.map(row => (
              <div
                key={row.key}
                className="h-36 animate-pulse rounded-8 bg-neutral-c20"
                aria-hidden
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {rows.map(row => (
              <StatRow key={row.key} label={row.label} value={row.value} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
