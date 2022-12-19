import memoize from "lodash/memoize";
const options = {
  style: "currency",
  currency: "USD",
};
const localeNotAvailable = (1.2).toLocaleString("en", options) !== "$1.20";

const getFallback = (locale) =>
  staticFallback[Object.keys(staticFallback).includes(locale) ? locale : "en"];

const staticFallback: Record<string, [string, string]> = {
  en: ["-$1.00", "10,000.2"],
  es: ["-1,00 US$", "10.000,2"],
  fr: ["-1,00 $US", "10 000,2"],
  ja: ["-US$1.00", "10,000.2"],
  ko: ["-US$1.00", "10,000.2"],
  ru: ["-1,00 $", "10 000,2"],
  zh: ["-US$1.00", "10,000.2"],
};
export const prefixFormat = ["sign", "code", "value"];
export const suffixFormat = ["sign", "value", "separator", "code"];
// returns decimal and thousands separator
// FIXME: rename thousands to group
export type GetSeparators = (locale: string) => {
  decimal: string | null | undefined;
  thousands: string | null | undefined;
};
export const getSeparators: GetSeparators = memoize((locale) => {
  const res = localeNotAvailable
    ? getFallback(locale)[1]
    : (10000.2).toLocaleString(locale);
  let decimal;
  let thousands;

  for (let i = 0; i < res.length; i++) {
    const c = res[i];
    if (/[0-9]/.test(c)) continue;

    if (!thousands) {
      thousands = c;
    } else {
      decimal = c;
    }
  }

  return {
    decimal,
    thousands,
  };
});
