import React from "react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import compareDate from "../../logic/compareDate";
import { languageSelector } from "../../reducers/settings";

type Props = {
  date: Date | undefined;
  baseDate?: Date | undefined;
};

const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 31536000000 },
  { unit: "month", ms: 2628000000 },
  { unit: "day", ms: 86400000 },
  { unit: "hour", ms: 3600000 },
  { unit: "minute", ms: 60000 },
  { unit: "second", ms: 1000 },
];

const defaultRelativeTimeFormatterSelector = createSelector(
  languageSelector,
  locale =>
    new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
    }),
);

/**
 * Get language-sensitive relative time message from Dates. Borrowed from https://stackoverflow.com/a/66390028
 * @param formatter
 * @param relative  - the relative dateTime, generally is in the past or future
 * @param pivot     - the dateTime of reference, generally is the current time
 */
export function relativeTimeFromDates(
  formatter: Intl.RelativeTimeFormat,
  relative: Date | null,
  pivot: Date = new Date(),
): string {
  if (!relative) return "";
  const elapsed = relative.getTime() - pivot.getTime();
  return relativeTimeFromElapsed(formatter, elapsed);
}

/**
 * Get language-sensitive relative time message from elapsed time.
 * @param formatter
 * @param elapsed   - the elapsed time in milliseconds
 */
export function relativeTimeFromElapsed(
  formatter: Intl.RelativeTimeFormat,
  elapsed: number,
): string {
  for (const { unit, ms } of units) {
    if (Math.abs(elapsed) >= ms || unit === "second") {
      return formatter.format(Math.round(elapsed / ms), unit);
    }
  }
  return "";
}

function FormatRelativeTime({
  date,
  baseDate = new Date(),
}: Props): JSX.Element | null {
  const defaultFormatter = useSelector(defaultRelativeTimeFormatterSelector);
  const jsx =
    date && date.getTime()
      ? relativeTimeFromDates(defaultFormatter, date, baseDate)
      : null;
  return <>{jsx}</>;
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  return (
    compareDate(prevProps.date, nextProps.date) &&
    compareDate(prevProps.baseDate, nextProps.baseDate)
  );
}

export default React.memo<Props>(FormatRelativeTime, areEqual);
