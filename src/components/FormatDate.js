// @flow
import React from "react";
import { useSelector } from "react-redux";

import compareDate from "../logic/compareDate";
import { localeSelector } from "../reducers/settings";
import { getDateFnsLocale } from "../helpers/dateFnsLocales";

type Props = {
  date: ?Date,
  format?: string,
};

function FormatDate({ date, format: formatProp = "MMMM d, yyyy" }: Props) {
  const locale = useSelector(localeSelector);

  return date && date.getTime()
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
        day: "numeric",
      }).format(date)
    : null;

  // const dateFnsLocale = getDateFnsLocale(locale);
  // return date && date.getTime()
  //   ? format(date, formatProp, { locale: dateFnsLocale })
  //   : null;
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  return compareDate(prevProps.date, nextProps.date);
}

export default React.memo<Props>(FormatDate, areEqual);
