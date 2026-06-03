import type { PnlReturnCard } from "LLM/features/Pnl/types";
import type { PnlDetailItem } from "LLM/features/Pnl/components/PnlDetailDrawer/types";

export type PnlSectionViewModel = {
  shouldDisplayPnl: boolean;
  /** Section heading ("Profit and loss") that opens the detail drawer. */
  title: string;
  unrealised: PnlReturnCard;
  realised: PnlReturnCard;
  openDrawer: () => void;
  drawer: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    items: PnlDetailItem[];
    footer: string;
    pageName: string;
    source: string;
  };
};
