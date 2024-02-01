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
