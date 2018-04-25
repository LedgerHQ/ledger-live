//@flow

import memoize from "lodash/memoize";

export const getFragPositions = memoize((locale: string): Array<*> => {
  const res = (-1).toLocaleString(locale, {
    currency: "USD",
    style: "currency"
  });
  const frags = [];
  let mandatoryFrags = 0;
  for (let i = 0; i < res.length; i++) {
    const c = res[i];
    if (c === "$") {
      // force code to be surround by separators. we'll dedup later
      frags.push("separator");
      frags.push("code");
      frags.push("separator");
      mandatoryFrags++;
    } else if (c === "-") {
      frags.push("sign");
      mandatoryFrags++;
    } else if (c === "1") {
      frags.push("value");
      mandatoryFrags++;
    } else if (/\s/.test(c)) {
      frags.push("separator");
    }
    if (mandatoryFrags === 3) return frags;
  }
  return frags;
});

// returns decimal and thousands separator
export const getSeparators = memoize((locale: string): {
  decimal: ?string,
  thousands: ?string
} => {
  const res = (10000.2).toLocaleString(locale);
  let decimal, thousands;
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
