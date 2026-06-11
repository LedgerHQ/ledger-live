import type { PnlTrend } from "@ledgerhq/wallet-pnl";

type TrendCard = {
  trend: PnlTrend;
};

type InteractiveCard = TrendCard & {
  type: "interactive";
  onClick: () => void;
};

type DisplayCard = TrendCard & {
  type: "display";
};

type InfoCard = {
  type: "info";
  tooltipContent: string;
  onTooltipOpenChange?: (open: boolean) => void;
};

type PnLCardProps = {
  id: string;
  title: string;
  value: string;
} & (InteractiveCard | DisplayCard | InfoCard);

export type { DisplayCard, InteractiveCard, InfoCard, PnLCardProps };
