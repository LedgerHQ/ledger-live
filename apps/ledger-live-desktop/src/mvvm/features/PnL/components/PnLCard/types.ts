type InteractiveCard = {
  type: "interactive";
  trend: "up" | "down";
  onClick: () => void;
};

type InfoCard = {
  type: "info";
  tooltipContent: string;
};

type PnLCardProps = {
  title: string;
  value: string;
  discreet?: boolean;
} & (InteractiveCard | InfoCard);

export type { InteractiveCard, InfoCard, PnLCardProps };
