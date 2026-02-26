import { useCallback } from "react";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";
import { formatRelativeDate } from "../utils/dateFormatter";

/**
 * Returns a function that formats a date as a relative time (e.g. "2 hours ago")
 * or a short date when older, using the current locale and translations.
 */
export function useFormatRelativeDate(): (date: Date) => string {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);

  return useCallback((date: Date) => formatRelativeDate(date, { t, locale }), [t, locale]);
}
