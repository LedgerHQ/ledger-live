import type { BigNumber } from "bignumber.js";
import type { PnLCardProps } from "./components/PnLCard/types";
import type { PnlDetailData } from "./builders/buildPnlDetail";

export type PnlNamespace = "pnl.asset" | "pnl.portfolio";

export type PnlNumbers = {
  unrealisedPnL: BigNumber;
  realisedPnL: BigNumber;
  totalPnL: BigNumber;
};

export type PnlSecondaryCardConfig = {
  id: string;
  titleKey: string;
  tooltipKey: string;
  value: BigNumber;
};

export type PnlViewModel = {
  shouldDisplayPnl: boolean;
  items: PnLCardProps[];
  detail: PnlDetailData;
  dialog: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onOpen: () => void;
  };
};
