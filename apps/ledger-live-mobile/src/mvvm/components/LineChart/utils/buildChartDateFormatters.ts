const HOVER_RANGE_WITH_TIME_AND_DATE = new Set(["1w", "1m", "6m"]);

export type ChartDateFormatters = Readonly<{
  formatAxisDate: (timestamp: number, range: string) => string;
  formatScrubHeaderDate: (timestamp: number, range: string) => string;
}>;

export function buildChartDateFormatters(locale: string): ChartDateFormatters {
  const hour = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "numeric" });
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const dateTime = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "numeric",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  return {
    formatAxisDate: (timestamp, range) => (range === "1d" ? hour : day).format(new Date(timestamp)),
    formatScrubHeaderDate: (timestamp, range) => {
      if (range === "1d") return hour.format(new Date(timestamp));
      if (HOVER_RANGE_WITH_TIME_AND_DATE.has(range)) return dateTime.format(new Date(timestamp));
      return day.format(new Date(timestamp));
    },
  };
}
