import type { PnlTrend } from "../../types";

type BasePnlCardProps = {
  title: string;
  value: string;
  testID?: string;
};

/** Pressable card with a trend and a chevron. */
type InteractivePnlCardProps = {
  type: "interactive";
  trend: PnlTrend;
  onPress: () => void;
};

/** Card with an info icon, optionally pressable. */
type InfoPnlCardProps = {
  type: "info";
  onPress?: () => void;
};

/** Display-only card showing a value with its trend, without chevron or info icon. */
type ValuePnlCardProps = {
  type: "value";
  trend: PnlTrend;
};

export type PnlCardProps = BasePnlCardProps &
  (InteractivePnlCardProps | InfoPnlCardProps | ValuePnlCardProps);
