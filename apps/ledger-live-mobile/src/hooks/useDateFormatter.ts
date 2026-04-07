import { useCallback, useMemo } from "react";
import { differenceInCalendarDays } from "date-fns";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import {
  ddmmyyyyFormatter,
  Format,
  genericFormatter,
  mmddyyyyFormatter,
} from "~/components/DateFormat/formatter.util";
import { dateFormatSelector, languageSelector } from "~/reducers/settings";

export function useFormatDate() {
  const language = useSelector(languageSelector);
  const dateFormat = useSelector(dateFormatSelector);

  const intlOpts =
    dateFormat === Format.default
      ? genericFormatter(language)
      : dateFormat === Format.ddmmyyyy
        ? ddmmyyyyFormatter
        : mmddyyyyFormatter;

  const f = useCallback((date: Date) => intlOpts.format(date), [intlOpts]);
  return f;
}

export function useFormatDaySection() {
  const { t } = useTranslation();
  const language = useSelector(languageSelector);

  const longDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [language],
  );

  return useCallback(
    (day: Date): string => {
      const dayDiff = differenceInCalendarDays(Date.now(), day);
      if (dayDiff === 0) return t("common.today");
      if (dayDiff === 1) return t("common.yesterday");
      return longDateFormatter.format(day);
    },
    [t, longDateFormatter],
  );
}
