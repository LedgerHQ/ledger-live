// @flow
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { localeSelector } from "../reducers/settings";

type Props = {
  date: Date,
};

export default function OperationRowDate({ date }: Props) {
  const locale = useSelector(localeSelector);

  const localeTimeString = useMemo(
    () =>
      date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [date, locale],
  );

  return `${localeTimeString}`;
}
