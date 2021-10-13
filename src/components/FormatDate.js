// @flow
import React from "react";
import { useSelector } from "react-redux";

import compareDate from "../logic/compareDate";
import { localeSelector } from "../reducers/settings";

type Props = {
  date: ?Date,
};

function FormatDate({ date }: Props) {
  const locale = useSelector(localeSelector);

  return date && date.getTime()
    ? new Intl.DateTimeFormat(locale).format(date)
    : null;
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  return compareDate(prevProps.date, nextProps.date);
}

export default React.memo<Props>(FormatDate, areEqual);
