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
type useDateFormatterOptions = {
  calendar?: boolean;
};

/**
 *
 * @returns a function that format a date into a string based on the current
 * locale.
 */
const useDateFormatter = (opts: useDateFormatterOptions, intlOpts?: Intl.DateTimeFormatOptions) => {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);

  const f = (date: Date) => {
    let formatedDate = new Intl.DateTimeFormat(locale, intlOpts).format(date);
    if (!opts.calendar) return formatedDate;

    const { yesterday, today, tomorrow } = getDatesAround();

    const isToday = dateEq(today, date);
    const isYesterday = dateEq(yesterday, date);
    const isTomorrow = dateEq(tomorrow, date);

    formatedDate = isToday
      ? formatedDate + ` – ${t("calendar.today")}`
      : isYesterday
      ? formatedDate + ` – ${t("calendar.yesterday")}`
      : isTomorrow
      ? formatedDate + ` – ${t("calendar.tomorrow")}`
      : formatedDate;

    return formatedDate;
  };

  return { f };
};

export default useDateFormatter;
