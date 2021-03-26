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
  const now = new Date(Date.now());
  if (count === 1) return [now];

  const conf = getPortfolioRangeConfig(r);
  const last = new Date(conf.startOf(now) - 1);
  const dates = [now];
  for (let i = 0; i < count - 1; i++) {
    dates.unshift(new Date(last - conf.increment * i));
  }
  return dates;
}
