import type { PortfolioRange, PortfolioRangeConfig } from "@ledgerhq/types-live";

const hourIncrement = 60 * 60 * 1000;
const dayIncrement = 24 * hourIncrement;
const weekIncrement = 7 * dayIncrement;

export function startOfHour(t: Date): Date {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours());
}
export function startOfDay(t: Date): Date {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
export function startOfWeek(t: Date): Date {
  const d = startOfDay(t);
  return new Date(d.getTime() - d.getDay() * dayIncrement);
}

// TODO Portfolio: this would require to introduce Account#olderOperationDate
const ranges: Record<PortfolioRange, PortfolioRangeConfig> = {
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

export function getRanges(): string[] {
  return Object.keys(ranges);
}

export function getDates(r: PortfolioRange, count: number): Date[] {
  const now = new Date(Date.now());
  if (count === 1) return [now];
  const conf = getPortfolioRangeConfig(r);
  const last = new Date(conf.startOf(now).getTime() - 1).getTime();
  const dates = [now];

  for (let i = 0; i < count - 1; i++) {
    dates.unshift(new Date(last - conf.increment * i));
  }

  return dates;
}

export function getPortfolioRangeConfig(r: PortfolioRange): PortfolioRangeConfig {
  return ranges[r];
}

export function getPortfolioCountByDate(start: Date, range: PortfolioRange): number {
  const conf = getPortfolioRangeConfig(range);
  const now = Date.now();
  const count = Math.ceil((now - start.getTime()) / conf.increment) + 2;
  const defaultYearCount = getPortfolioRangeConfig("year").count ?? 0; // just for type casting

  return count < defaultYearCount ? defaultYearCount : count;
}
