// @flow

import memoize from "lodash/memoize";

const options = { style: "currency", currency: "USD" };
const localeNotAvailable = (1.2).toLocaleString("en", options) !== "$1.20";
const getFallback = locale =>
  staticFallback[Object.keys(staticFallback).includes(locale) ? locale : "en"];
const staticFallback: { [string]: [string, string] } = {
  en: ["-$1.00", "10,000.2"],
  es: ["-1,00 US$", "10.000,2"],
  fr: ["-1,00 $US", "10 000,2"],
  ja: ["-US$1.00", "10,000.2"],
  ko: ["-US$1.00", "10,000.2"],
  ru: ["-1,00 $", "10 000,2"],
  zh: ["-US$1.00", "10,000.2"]
};

export const getFragPositions: (locale: string) => Array<*> = memoize(
  locale => {
    let oneChar;
    let res;

    if (localeNotAvailable) {
      [oneChar, res] = ["1", ...getFallback(locale)];
    } else {
      oneChar = (1).toLocaleString(locale)[0];
      res = (-1).toLocaleString(locale, options);
    }

    const frags = [];
    let mandatoryFrags = 0;
    let codeFound = false;
    for (let i = 0; i < res.length; i++) {
      const c = res[i];
      if (c === "$" || c === "U") {
        if (!codeFound) {
          codeFound = true;
          // force code to be surround by separators. we'll dedup later
          frags.push("separator");
          frags.push("code");
          frags.push("separator");
          mandatoryFrags++;
        }
      } else if (c === "-") {
        frags.push("sign");
        mandatoryFrags++;
      } else if (c === oneChar) {
        frags.push("value");
        mandatoryFrags++;
      } else if (/\s/.test(c)) {
        frags.push("separator");
      }
      if (mandatoryFrags === 3) return frags;
    }
    return frags;
  }
);

// returns decimal and thousands separator
// FIXME: rename thousands to group
export type GetSeparators = (
  locale: string
) => {
  decimal: ?string,
  thousands: ?string
};
export const getSeparators: GetSeparators = memoize(locale => {
  let res = localeNotAvailable
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
  return { decimal, thousands };
});
