import React from "react";
import { useSelector } from "react-redux";
import i18next from "i18next";
import { differenceInCalendarDays } from "date-fns";
import { createSelector } from "reselect";
import compareDate from "../../logic/compareDate";
import { dateFormatSelector, languageSelector } from "../../reducers/settings";
import {
  ddmmyyyyFormatter,
  Format,
  genericFormatter,
  mmddyyyyFormatter,
} from "./formatter.util";

type Props = {
  day: Date;
};

const localeDateTimeFormatSelector = createSelector(
  languageSelector,
  language => genericFormatter(language),
);

const FormatDay = ({ day }: Props) => {
  const dateTimeFormat = useSelector(localeDateTimeFormatSelector);

  const dateFormat = useSelector(dateFormatSelector);
  const dateFormatOptions =
    dateFormat === Format.default
      ? dateTimeFormat
      : dateFormat === Format.ddmmyyyy
      ? ddmmyyyyFormatter
      : mmddyyyyFormatter;

  const dayDiff = differenceInCalendarDays(Date.now(), day);
  const suffix =
    dayDiff === 0
      ? ` - ${i18next.t("common.today")}`
      : dayDiff === 1
      ? ` - ${i18next.t("common.yesterday")}`
      : "";
  const formattedDate = dateFormatOptions.format(day);
  return (
    <>
      {formattedDate}
      {suffix}
    </>
  );
};

export default React.memo(FormatDay, (prevProps, newProps) => {
  const isSameDay = compareDate(prevProps.day, newProps.day);
  return !isSameDay;
});
