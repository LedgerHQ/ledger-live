import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { AddressListSection } from "../AddressList";
import { TotalBalance } from "./TotalBalance";
import { usePortfolioSectionViewModel } from "./usePortfolioSectionViewModel";

type PortfolioSectionProps = Readonly<{
  distributionItem: DistributionItem;
}>;

export function PortfolioSection({ distributionItem }: PortfolioSectionProps) {
  const { visible } = usePortfolioSectionViewModel(distributionItem);

  if (!visible) {
    return null;
  }

  return (
    <>
      <TotalBalance distributionItem={distributionItem} />
      <AddressListSection distributionItem={distributionItem} />
    </>
  );
}
