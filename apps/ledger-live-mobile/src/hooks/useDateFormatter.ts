import { useCallback, useMemo } from "react";
import { useSettings } from "~/hooks";

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
 * @returns a function that format a date into a string based on the current language
 */
export function useLangDateFormatter(intlOpts?: Intl.DateTimeFormatOptions) {
  const { language } = useSettings();

  const format = useMemo(() => new Intl.DateTimeFormat(language, intlOpts), [language, intlOpts]);
  const f = useCallback((date: Date) => format.format(date), [format]);
  return f;
}
