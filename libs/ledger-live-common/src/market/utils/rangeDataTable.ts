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
    label: "1y",
    scale: "year",
  },
  "30d": {
    days: 30,
    interval: "daily",
    label: "1m",
    scale: "month",
  },
  "7d": {
    days: 7,
    interval: "hourly",
    label: "1w",
    scale: "week",
  },
  "24h": {
    days: 1,
    interval: "hourly",
    label: "1d",
    scale: "day",
  },
  "1h": {
    days: 0.04,
    interval: "5m",
    label: "1h",
    scale: "minute",
  },
};
