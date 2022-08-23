// @flow
import React from "react";
import { useSelector } from "react-redux";

import compareDate from "../logic/compareDate";
import { localeSelector } from "../reducers/settings";

type Props = {
  date: ?Date,
  withHoursMinutes?: boolean,
};

const defaultOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
};
const hoursAndMinutesOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

function FormatDate({ date, withHoursMinutes = false }: Props) {
  const locale = useSelector(localeSelector);

  return date && date.getTime()
    ? new Intl.DateTimeFormat(locale, {
        ...defaultOptions,
        ...(withHoursMinutes ? hoursAndMinutesOptions : {}),
      }).format(date)
    : null;
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  return compareDate(prevProps.date, nextProps.date);
}

export default React.memo<Props>(FormatDate, areEqual);
