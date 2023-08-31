import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { localeSelector } from "~/renderer/reducers/settings";

/**
 *
 * @param d1 date one
 * @param d2 date two
 * @returns true if dates are equals, else returns false.
 */
function dateEq(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 *
 * @returns an object containing 3 dates relatives to the current time: yesterday, today and tomorrow.
 */
const getDatesAround = () => {
  const today = new Date();

  const todayAsTime = today.getTime();
  const todayAsDate = today.getDate();

  const tomorrow = new Date(new Date(todayAsTime).setDate(todayAsDate + 1));
  const yesterday = new Date(new Date(todayAsTime).setDate(todayAsDate - 1));

  return { yesterday, today, tomorrow };
};

/**
 *
 * @dev default options for useDateFormatter.
 */
export type useDateFormatterOptions = {
  calendar?: boolean;
};

/**
 *
 * @returns a function that format a date into a string based on the current
 * locale.
 */
const useDateFormatter = (
  opts?: useDateFormatterOptions,
  intlOpts?: Intl.DateTimeFormatOptions,
) => {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);

  const f = (date: Date) => {
    const formatedDate = new Intl.DateTimeFormat(locale, intlOpts).format(date);
    if (!opts?.calendar) return formatedDate;

    const { yesterday, today, tomorrow } = getDatesAround();

    if (dateEq(yesterday, date)) return `${formatedDate} – ${t("calendar.yesterday")}`;
    if (dateEq(today, date)) return `${formatedDate} – ${t("calendar.today")}`;
    if (dateEq(tomorrow, date)) return `${formatedDate} – ${t("calendar.tomorrow")}`;
    return formatedDate;
  };

  return { f };
};

export { dateEq, getDatesAround };

export default useDateFormatter;
