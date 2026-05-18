import React from "react";
import { PnlDetail } from "./PnlDetail";
import { PnLView } from "./PnLView";
import type { PnlViewModel } from "../types";

type Props = Readonly<{
  viewModel: PnlViewModel;
  direction?: "row" | "col";
}>;

export function PnLSection({ viewModel, direction }: Props) {
  if (!viewModel.shouldDisplayPnl) return null;

  return (
    <>
      <PnLView items={viewModel.items} direction={direction} />
      <PnlDetail
        open={viewModel.dialog.isOpen}
        onOpenChange={viewModel.dialog.onOpenChange}
        {...viewModel.detail}
      />
    </>
  );
}
