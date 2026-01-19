import React, { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { createSelector } from "~/context/selectors";
import { localeSelector } from "~/reducers/settings";

type Props = {
  date: Date;
};

const localeDateTimeFormatSelector = createSelector(
  localeSelector,
  locale =>
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
);

export default function OperationRowDate({ date }: Props) {
  const dateTimeFormat = useSelector(localeDateTimeFormatSelector);
  const localeTimeString = useMemo(() => dateTimeFormat.format(date), [date, dateTimeFormat]);
  return <>{localeTimeString}</>;
}
