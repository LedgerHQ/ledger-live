// @flow

export type ItemArray =
  | {
      date: ?Date,
      value: number,
    }[]
  | {
      date: ?Date,
      value: number,
      countervalue?: number,
    }[];

export type Item =
  | {
      date: ?Date,
      value: number,
    }
  | {
      date: ?Date,
      value: number,
      countervalue: number,
    };
