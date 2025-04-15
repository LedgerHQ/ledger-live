export type RangeData = {
  days: number;
  interval: string;
  label: string;
  scale: string;
};

export const rangeDataTable: { [key: string]: RangeData } = {
  "1y": {
    days: 365,
    interval: "daily",
    label: "1Y_label",
    scale: "year",
  },
  "30d": {
    days: 30,
    interval: "daily",
    label: "1M_label",
    scale: "month",
  },
  "7d": {
    days: 7,
    interval: "hourly",
    label: "1W_label",
    scale: "week",
  },
  "24h": {
    days: 1,
    interval: "hourly",
    label: "1D_label",
    scale: "day",
  },
  "1h": {
    days: 0.04,
    interval: "5m",
    label: "1H_label",
    scale: "minute",
  },
};
