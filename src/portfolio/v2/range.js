// @flow
import {
  weekIncrement,
  dayIncrement,
  hourIncrement,
  startOfWeek,
  startOfDay,
  startOfHour,
} from "../range";
import type { PortfolioRangeConfig, PortfolioRange } from "./types";

export function getPortfolioRangeConfig(
  r: PortfolioRange
): PortfolioRangeConfig {
  return ranges[r];
}

// TODO Protfolio: this would require to introduce Account#olderOperationDate
const ranges: { [k: PortfolioRange]: PortfolioRangeConfig } = {
  all: {
    increment: weekIncrement,
    startOf: startOfWeek,
    granularityId: "WEEK",
  },
  year: {
    count: 52,
    increment: weekIncrement,
    startOf: startOfWeek,
    granularityId: "WEEK",
  },
  month: {
    count: 30,
    increment: dayIncrement,
    startOf: startOfDay,
    granularityId: "DAY",
  },
  week: {
    count: 7 * 24,
    increment: hourIncrement,
    startOf: startOfHour,
    granularityId: "HOUR",
  },
  day: {
    count: 24,
    increment: hourIncrement,
    startOf: startOfHour,
    granularityId: "HOUR",
  },
};

export function getDates(r: PortfolioRange, count: number): Date[] {
  const conf = getPortfolioRangeConfig(r);
  const now = new Date(Date.now());
  if (count === 1) return [now];

  const last = new Date(conf.startOf(now) - 1);
  const datesExceptNow = Array.from(
    { length: count - 1 },
    (_, i) => new Date(last - conf.increment * i)
  ).reverse();

  return [...datesExceptNow, now];
}
