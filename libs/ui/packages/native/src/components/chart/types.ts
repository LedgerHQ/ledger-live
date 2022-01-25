export type Item = {
  date: Date;
  value?: number | string;
} & { [key: string]: number | string };
