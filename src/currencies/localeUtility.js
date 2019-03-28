// @flow

import memoize from "lodash/memoize";

export const getFragPositions: (locale: string) => Array<*> = memoize(
  locale => {
    const oneChar = (1).toLocaleString(locale)[0];
    const res = (-1).toLocaleString(locale, {
      currency: "USD",
      style: "currency"
    });
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
  const res = (10000.2).toLocaleString(locale);
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
