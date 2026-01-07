import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
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
