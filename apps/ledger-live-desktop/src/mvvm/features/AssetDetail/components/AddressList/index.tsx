import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { AddressListSectionSkeleton } from "./AddressListSectionSkeleton";
import { AddressListSection as AddressListSectionComponent } from "./AddressListSection";
import { shouldShowAssetDetailSectionSkeleton } from "../../utils/shouldShowAssetDetailSectionSkeleton";

export type AddressListSectionProps = Readonly<{
  distributionItem?: DistributionItem;
  isLoading: boolean;
}>;

export function AddressListSection({ distributionItem, isLoading }: AddressListSectionProps) {
  if (shouldShowAssetDetailSectionSkeleton(isLoading, distributionItem != null)) {
    return <AddressListSectionSkeleton />;
  }

  if (!distributionItem) return null;

  return <AddressListSectionComponent distributionItem={distributionItem} />;
}
