type InteractivePnlCardProps = {
  type: "interactive";
  trend: "up" | "down" | "neutral";
  onPress: () => void;
};

type InfoPnlCardProps = {
  type: "info";
  onPress?: () => void;
};

export type PnlCardProps = {
  title: string;
  value: string;
  testID?: string;
} & (InteractivePnlCardProps | InfoPnlCardProps);
