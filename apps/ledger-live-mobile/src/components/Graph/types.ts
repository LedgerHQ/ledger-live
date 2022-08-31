export type ItemArray =
  | {
      date: Date | null | undefined;
      value: number;
    }[]
  | {
      date: Date | null | undefined;
      value: number;
      countervalue?: number;
    }[];
export type Item =
  | {
      date: Date | null | undefined;
      value: number;
    }
  | {
      date: Date | null | undefined;
      value: number;
      countervalue: number;
    };
