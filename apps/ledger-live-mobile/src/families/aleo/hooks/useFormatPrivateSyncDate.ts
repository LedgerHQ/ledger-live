import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";

const privateSyncDateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
};

export function useFormatPrivateSyncDate() {
  const locale = useSelector(localeSelector);

  return useCallback(
    (date: Date) => new Intl.DateTimeFormat(locale, privateSyncDateFormat).format(date),
    [locale],
  );
}
