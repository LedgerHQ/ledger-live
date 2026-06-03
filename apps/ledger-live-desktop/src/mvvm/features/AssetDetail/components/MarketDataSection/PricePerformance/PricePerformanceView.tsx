import React from "react";
import { SectionHeader } from "../../SectionHeader";
import { PricePerformanceSectionSkeleton } from "../components/PricePerformanceSectionSkeleton";
import { MarketDataSectionTitleSkeleton } from "../components/MarketDataSectionTitleSkeleton";
import { PricePerformanceListRow } from "./components/PricePerformanceListRow";
import type { PricePerformanceViewModelResult } from "./hooks/usePricePerformanceViewModel";

type Props = Readonly<PricePerformanceViewModelResult>;

export function PricePerformanceView({
  sectionTitle,
  athBlock,
  atlBlock,
  showSkeleton,
  sectionDisclaimer,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-16">
      {showSkeleton ? <MarketDataSectionTitleSkeleton /> : <SectionHeader title={sectionTitle} />}
      <div className="text-body">
        {showSkeleton ? (
          <PricePerformanceSectionSkeleton />
        ) : (
          <div className="flex flex-col gap-12">
            <PricePerformanceListRow
              leadingTitle={athBlock.title}
              leadingDescription={athBlock.dateLine}
              trailingTitle={athBlock.priceText}
              trailingDescription={athBlock.changeText}
            />
            <PricePerformanceListRow
              leadingTitle={atlBlock.title}
              leadingDescription={atlBlock.dateLine}
              trailingTitle={atlBlock.priceText}
              trailingDescription={atlBlock.changeText}
            />
            <PricePerformanceListRow leadingTitle={sectionDisclaimer} trailingTitle={""} />
          </div>
        )}
      </div>
    </div>
  );
}
