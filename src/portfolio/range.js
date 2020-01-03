// @flow

import type { PortfolioRange, PortfolioRangeConfig } from "../types";
import { getEnv } from "../env";

const hourIncrement = 60 * 60 * 1000;
const dayIncrement = 24 * hourIncrement;
const weekIncrement = 7 * dayIncrement;

export function startOfHour(t: Date) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours());
}

export function startOfMonth(t: Date) {
  return new Date(t.getFullYear(), t.getMonth(), 1);
}

export function startOfDay(t: Date) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function startOfWeek(t: Date) {
  const d = startOfDay(t);
  return new Date(d.getTime() - d.getDay() * dayIncrement);
}

// TODO we need to rework this to allow "all" time range
// this would require to introduce Account#olderOperationDate

const stable: { [k: PortfolioRange]: PortfolioRangeConfig } = {
  year: {
    count: 365,
    increment: dayIncrement,
    startOf: startOfDay,
    granularityId: "DAY"
  },
  month: {
    count: 30,
    increment: dayIncrement,
    startOf: startOfDay,
    granularityId: "DAY"
  },
  week: {
    count: 7,
    increment: dayIncrement,
    startOf: startOfDay,
    granularityId: "DAY"
  }
};

const experimental: { [k: PortfolioRange]: PortfolioRangeConfig } = {
  year: {
    count: 52,
    increment: weekIncrement,
    startOf: startOfWeek,
    granularityId: "WEEK"
  }
  /*
  week: {
    count: 7 * 24,
    increment: hourIncrement,
    startOf: startOfHour,
    granularityId: "HOUR"
  }
  */
};

const getPerPortfolioRanges = (): {
  [k: PortfolioRange]: PortfolioRangeConfig
} => {
  if (!getEnv("EXPERIMENTAL_PORTFOLIO_RANGE")) return stable;
  return { ...stable, ...experimental };
};

export function getPortfolioRangeConfig(
  r: PortfolioRange
): PortfolioRangeConfig {
  return getPerPortfolioRanges()[r];
}

export const getRanges = (): PortfolioRange[] =>
  Object.keys(getPerPortfolioRanges());

export function getDates(r: PortfolioRange): Date[] {
  const conf = getPortfolioRangeConfig(r);
  let t = new Date();
  const array = [t];
  t = new Date(conf.startOf(t) - 1); // end of yesterday
  for (let d = conf.count - 1; d > 0; d--) {
    array.unshift(t);
    t = new Date(t - conf.increment);
  }
  return array;
}
