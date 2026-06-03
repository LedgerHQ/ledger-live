import React from "react";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { StatRow } from "../components/StatRow";
import { MarketDataStatRowSkeletons } from "../components/MarketDataStatRowSkeletons";
import { MarketDataSectionTitleSkeleton } from "../components/MarketDataSectionTitleSkeleton";
import type { MarketStatsViewModelResult } from "./hooks/useMarketStatsViewModel";

type Props = Readonly<MarketStatsViewModelResult>;

export function MarketStatsView({
  rows,
  showSkeleton,
  sectionTitle,
  sectionTooltip,
  onTooltipOpen,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-16">
      {showSkeleton ? (
        <MarketDataSectionTitleSkeleton />
      ) : (
        <Subheader>
          <SubheaderRow className="min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <SubheaderTitle>{sectionTitle}</SubheaderTitle>
              <Tooltip onOpenChange={open => onTooltipOpen("market_stats", open)}>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help">
                    <Information size={16} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{sectionTooltip}</TooltipContent>
              </Tooltip>
            </div>
          </SubheaderRow>
        </Subheader>
      )}
      <div className="text-body">
        {showSkeleton ? (
          <MarketDataStatRowSkeletons count={rows.length} />
        ) : (
          <div className="flex flex-col gap-8">
            {rows.map(row => (
              <StatRow
                key={row.key}
                label={row.label}
                value={row.value}
                tooltip={row.tooltip}
                onTooltipOpenChange={open => onTooltipOpen(row.key, open)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
