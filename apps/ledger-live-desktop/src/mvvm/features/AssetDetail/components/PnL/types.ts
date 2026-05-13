import type { PnLCardProps } from "LLD/features/PnL/components/PnLCard/types";
import type { PnlDetailData } from "./buildPnlDetail";

export type PnlCardId = "unrealisedReturn" | "averageEntryPrice";

export type PnlViewModel = {
  shouldDisplayPnl: boolean;
  items: PnLCardProps[];
  detail: PnlDetailData;
  dialog: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
  };
};
