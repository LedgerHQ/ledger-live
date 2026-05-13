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
  id: string;
  title: string;
  value: string;
} & (InteractiveCard | InfoCard);

export type { InteractiveCard, InfoCard, PnLCardProps };
