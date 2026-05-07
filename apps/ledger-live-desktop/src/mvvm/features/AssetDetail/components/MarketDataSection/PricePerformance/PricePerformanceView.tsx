import React from "react";
import { SectionHeader } from "../../SectionHeader";
import { PricePerformanceListRow } from "./components/PricePerformanceListRow";
import type { PricePerformanceViewModelResult } from "./hooks/usePricePerformanceViewModel";

type Props = Readonly<PricePerformanceViewModelResult>;

export function PricePerformanceView({
  sectionTitle,
  athBlock,
  atlBlock,
  range24hRow,
  showSkeleton,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-12">
      <SectionHeader title={sectionTitle} />
      <div className="text-body">
        {showSkeleton ? (
          <div className="flex flex-col gap-8 pt-8">
            <div className="h-88 animate-pulse rounded-12 bg-neutral-c20" />
            <div className="h-88 animate-pulse rounded-12 bg-neutral-c20" />
            <div className="h-36 animate-pulse rounded-8 bg-neutral-c20" />
          </div>
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
            <PricePerformanceListRow
              leadingTitle={range24hRow.label}
              trailingTitle={range24hRow.value}
            />
          </div>
        )}
      </div>
    </div>
  );
}
