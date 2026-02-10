import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
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
