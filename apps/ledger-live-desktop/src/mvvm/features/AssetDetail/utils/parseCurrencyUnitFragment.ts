import type { FormatterValue } from "@ledgerhq/live-common/currencies/index";

export function parseCurrencyUnitFragment(fragment: FormatterValue) {
  const prefixSymbol =
    fragment.currencyPosition === "start" && fragment.currencyText ? fragment.currencyText : null;
  const suffixSymbol =
    fragment.currencyPosition === "end" && fragment.currencyText ? fragment.currencyText : null;

  return {
    prefixSymbol,
    suffixSymbol,
    hasDecimals: Boolean(fragment.decimalPart),
    integerPart: fragment.integerPart,
    decimalSeparator: fragment.decimalSeparator,
    decimalPart: fragment.decimalPart,
  };
}
