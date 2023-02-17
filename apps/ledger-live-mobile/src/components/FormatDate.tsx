import React from "react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import compareDate from "../logic/compareDate";
import { localeSelector } from "../reducers/settings";

type Props = {
  date: Date | null | undefined;
  withHoursMinutes?: boolean;
};

const defaultOptionsSelector = createSelector(
  localeSelector,
  locale =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }),
);

const hoursAndMinutesOptionsSelector = createSelector(
  localeSelector,
  locale =>
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
);

function FormatDate({
  date,
  withHoursMinutes = false,
}: Props): JSX.Element | null {
  const defaultOptions = useSelector(defaultOptionsSelector);
  const hoursAndMinutesOptions = useSelector(hoursAndMinutesOptionsSelector);
  const jsx =
    date && date.getTime()
      ? withHoursMinutes
        ? defaultOptions.format(date)
        : hoursAndMinutesOptions.format(date)
      : null;
  return <>{jsx}</>;
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  return compareDate(prevProps.date, nextProps.date);
}

export default React.memo<Props>(FormatDate, areEqual);
