export type Item = {
  date: Date;
  value?: number;
} & { [key: string]: number };
