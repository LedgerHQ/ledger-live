import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";

export const MAX_INTEGER_CHARS = 9;
const ELLIPSIS = "…";

export function capFormattedValue(value: FormattedValue): FormattedValue {
  if (value.integerPart.length <= MAX_INTEGER_CHARS) return value;
  return {
    ...value,
    integerPart: value.integerPart.slice(0, MAX_INTEGER_CHARS) + ELLIPSIS,
    decimalPart: "",
  };
}
