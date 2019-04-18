// @flow

import { BigNumber } from "bignumber.js";

export type ItemArray =
  | {
      date: Date,
      value: BigNumber,
    }[]
  | {
      date: Date,
      value: BigNumber,
      countervalue?: BigNumber,
    }[];

export type Item =
  | {
      date: Date,
      value: BigNumber,
    }
  | {
      date: Date,
      value: BigNumber,
      countervalue: BigNumber,
    };
