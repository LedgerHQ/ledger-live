import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { PnLSection as SharedPnLSection } from "LLD/features/PnL/components/PnLSection";
import { useAssetPnlViewModel } from "./useAssetPnlViewModel";

type Props = Readonly<{
  distributionItem: DistributionItem;
}>;

export function PnLSection({ distributionItem }: Props) {
  const viewModel = useAssetPnlViewModel({ distributionItem });
  return <SharedPnLSection viewModel={viewModel} direction="row" />;
}
