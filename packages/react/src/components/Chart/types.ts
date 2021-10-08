export type Item = {
  date: Date;
  value?: number | string;
} & { [key: string]: number | string };

type Unit =
  | "millisecond"
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

export type timeOptions = {
  unit?: Unit;
  displayFormats?: { [unit in Unit]?: string };
};
