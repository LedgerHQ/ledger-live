import type { TriangleUp, TriangleDown } from "@ledgerhq/lumen-ui-react/symbols";

type TrendIconConfig = {
  Icon: typeof TriangleUp | typeof TriangleDown;
  className: string;
};

type InteractiveCard = {
  type: "interactive";
  trendIcon: TrendIconConfig;
  onClick: () => void;
};

type InfoCard = {
  type: "info";
  tooltipContent: string;
};

type PnLCardProps = {
  id: string;
  title: string;
  value: string;
} & (InteractiveCard | InfoCard);

export type { InteractiveCard, InfoCard, PnLCardProps, TrendIconConfig };
