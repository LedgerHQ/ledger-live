import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { localeSelector } from "~/renderer/reducers/settings";

export const hourFormat: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "numeric",
};

export const dayFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "numeric",
  year: "numeric",
};

export const dayAndHourFormat: Intl.DateTimeFormatOptions = {
  ...dayFormat,
  ...hourFormat,
};

/**
 *
 * @param d1 date one
 * @param d2 date two
 * @returns true if dates are equals, else returns false.
 */
export function dateEq(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 *
 * @returns an object containing 3 dates relatives to the current time: yesterday, today and tomorrow.
 */
export const getDatesAround = () => {
  const today = new Date();

  const todayAsTime = today.getTime();
  const todayAsDate = today.getDate();

  const tomorrow = new Date(new Date(todayAsTime).setDate(todayAsDate + 1));
  const yesterday = new Date(new Date(todayAsTime).setDate(todayAsDate - 1));

  return { yesterday, today, tomorrow };
};

/**
 *
 * @dev default options for useDateFormatter.
 */
export type useDateFormatterOptions = {
  calendar?: boolean;
};

/**
 *
 * @returns a function that format a date into a string based on the current
 * locale.
 */
export const useDateFormatter = (intlOpts?: Intl.DateTimeFormatOptions) => {
  const locale = useSelector(localeSelector);
  const format = useMemo(() => new Intl.DateTimeFormat(locale, intlOpts), [locale, intlOpts]);
  const f = useCallback((date: Date) => format.format(date), [format]);
  return f;
};

export const useDateFormatted = (date?: Date, intlOpts?: Intl.DateTimeFormatOptions): string => {
  const dateFormatter = useDateFormatter(intlOpts);
  return useMemo(() => (date ? dateFormatter(date) : ""), [date, dateFormatter]);
};

/**
 * custom format that suffix the date with "yesterday", "today" or "tomorrow"
 */
export const useCalendarFormatter = (intlOpts?: Intl.DateTimeFormatOptions) => {
  const { t } = useTranslation();
  const dateFormatter = useDateFormatter(intlOpts);

  const f = useCallback(
    (date: Date) => {
      const formatedDate = dateFormatter(date);
      const { yesterday, today, tomorrow } = getDatesAround();
      if (dateEq(yesterday, date)) return `${formatedDate} – ${t("calendar.yesterday")}`;
      if (dateEq(today, date)) return `${formatedDate} – ${t("calendar.today")}`;
      if (dateEq(tomorrow, date)) return `${formatedDate} – ${t("calendar.tomorrow")}`;
      return formatedDate;
    },
    [dateFormatter, t],
  );

  return f;
};

export const useCalendarFormatted = (
  date?: Date,
  intlOpts?: Intl.DateTimeFormatOptions,
): string => {
  const dateFormatter = useCalendarFormatter(intlOpts);
  return useMemo(() => (date ? dateFormatter(date) : ""), [date, dateFormatter]);
};

// make it format for technical usage in a readable way (that can also be put into a file name)
// using the format YYYY.MM.DD-HH.mm.ss
export const useTechnicalDateTimeFn = (): ((date?: Date) => string) => {
  return useCallback(
    (date?: Date) =>
      (date || new Date())
        .toISOString()
        .slice(0, 19)
        .replace(/-/g, ".")
        .replace("T", "-")
        .replace(/:/g, "."),
    [],
  );
};

// using the format YYYY.MM.DD
export const useTechnicalDateFn = (): ((date?: Date) => string) => {
  return useCallback(
    (date?: Date) => (date || new Date()).toISOString().slice(0, 10).replace(/-/g, "."),
    [],
  );
};

export function relativeTime(currentDate: Date, targetDate: Date): string {
  const diffMilliseconds = targetDate.getTime() - currentDate.getTime();

  const seconds = Math.round(diffMilliseconds / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30);
  const years = Math.round(months / 12);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (years) {
    return rtf.format(years, Math.abs(years) > 1 ? "years" : "year");
  } else if (months) {
    return rtf.format(months, Math.abs(months) > 1 ? "months" : "month");
  } else if (days) {
    return rtf.format(days, Math.abs(days) > 1 ? "days" : "day");
  } else if (hours) {
    return rtf.format(hours, Math.abs(hours) > 1 ? "hours" : "hour");
  } else if (minutes) {
    return rtf.format(minutes, Math.abs(minutes) > 1 ? "minutes" : "minute");
  }
  return rtf.format(seconds, Math.abs(seconds) > 1 ? "seconds" : "second");
}

export function fromNow(date: Date): string {
  const currentDate = new Date();
  const targetDate = new Date(date);
  return relativeTime(currentDate, targetDate);
}

export const useDateFromNow = (date?: Date | null | undefined): string =>
  useMemo(() => (date ? fromNow(date) : ""), [date]);
