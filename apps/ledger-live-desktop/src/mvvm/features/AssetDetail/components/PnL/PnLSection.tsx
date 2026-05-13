import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { PnlDetail } from "LLD/features/PnL/components/PnlDetail";
import { usePnlViewModel } from "./usePnlViewModel";
import { PnLView } from "./PnLView";

type Props = {
  distributionItem: DistributionItem;
};

export function PnLSection({ distributionItem }: Props) {
  const viewModel = usePnlViewModel({ distributionItem });

  if (!viewModel.shouldDisplayPnl) return null;

  return (
    <>
      <PnLView items={viewModel.items} />
      <PnlDetail
        open={viewModel.dialog.isOpen}
        onOpenChange={viewModel.dialog.onOpenChange}
        {...viewModel.detail}
      />
    </>
  );
}
