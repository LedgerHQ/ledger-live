import React from "react";
import { useSelector } from "react-redux";
import compareDate from "../logic/compareDate";
import { localeSelector } from "../reducers/settings";

type Props = {
  date: Date | null | undefined;
  withHoursMinutes?: boolean;
};
const defaultOptions = {
  year: "numeric" as const,
  month: "numeric" as const,
  day: "numeric" as const,
};
const hoursAndMinutesOptions = {
  hour: "2-digit" as const,
  minute: "2-digit" as const,
};

function FormatDate({
  date,
  withHoursMinutes = false,
}: Props): JSX.Element | null {
  const locale = useSelector(localeSelector);
  const jsx =
    date && date.getTime()
      ? new Intl.DateTimeFormat(locale, {
          ...defaultOptions,
          ...(withHoursMinutes ? hoursAndMinutesOptions : {}),
        }).format(date)
      : null;
  return <>{jsx}</>;
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  return compareDate(prevProps.date, nextProps.date);
}

export default React.memo<Props>(FormatDate, areEqual);
