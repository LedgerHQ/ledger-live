// @flow
import { useMemo } from "react";
import { useLocale } from "../context/Locale";

type Props = {
  date: Date,
};

export default function OperationRowDate({ date }: Props) {
  const { locale } = useLocale();

  const localeTimeString = useMemo(
    () =>
      date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [date, locale],
  );

  return `at ${localeTimeString}`;
}
