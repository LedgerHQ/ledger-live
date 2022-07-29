// remove the extra decimals that can't be represented in unit
// this function will preserve the string characters
// for instance EUR 1230.00234 will be transformed to EUR 1230.00
// NB this function parse a subset of formats because it it locale independent.
// make sure you have at least following options set on the formatter:

import type { Unit } from "@ledgerhq/types-cryptoassets";

// - useGrouping: true
export const chopCurrencyUnitDecimals = (
  unit: Unit,
  valueString: string
): string => {
  let str = "";
  let decimals = -1;

  for (let i = 0; i < valueString.length; i++) {
    const c = valueString[i];

    if (decimals >= 0 && /[0-9]/.test(c)) {
      decimals++;

      if (decimals > unit.magnitude) {
        continue;
      }
    } else if (c === "," || c === ".") {
      decimals = 0;
    }

    str += c;
  }

  return str;
};
