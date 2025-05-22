import { useMemo } from "react";
import { useLocale } from "~/context/Locale";

export function useDateFormat() {
  const { locale } = useLocale();

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [locale],
  );

  return {
    dateFormatter,
    locale,
  };
}
