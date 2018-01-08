//@flow
import fiatUnits from "./fiat-units";
import type { Currency, Unit, Rate } from "./types";

// This define utility to deal with currencies, units, countervalues

type UnitValue = { value: number, unit: Unit };

export function getCurrency(
  currencies: Array<Currency>,
  currencyName: string
): Currency {
  const currency = currencies.find(c => c.name === currencyName);
  if (!currency) {
    throw new Error(`currency "${currencyName}" not found`);
  }
  return currency;
}

export function getFiatUnit(fiat: string): Unit {
  const unit = fiatUnits[fiat];
  if (!unit) {
    throw new Error(`unit "${fiat}" not found`);
  }
  return unit;
}

export function getUnitFromRate(rate: Rate): Unit {
  const unit = fiatUnits[rate.fiat];
  if (!unit) {
    throw new Error(`countervalue "${rate.fiat}" not found`);
  }
  return unit;
}

// calculate the counter value at a specific rate
export function countervalueForRate(rate: Rate, value: number): UnitValue {
  const unit = getUnitFromRate(rate);
  return {
    value: Math.round(rate.value * value),
    unit
  };
}

const nonBreakableSpace = " ";
export function formatCurrencyUnit(
  unit: Unit,
  value: number,
  // TODO probably should have an option object, so it's more readable than writing (unit,value,false,true,false)
  showCode: boolean = false,
  alwaysShowSign: boolean = false,
  showAllDigits: boolean = false
): string {
  const { magnitude, code } = unit;
  const floatValue = value / 10 ** magnitude;
  const minimumFractionDigits = showAllDigits ? magnitude : 0;
  const maximumFractionDigits = Math.max(
    minimumFractionDigits,
    Math.max(
      0,
      // dynamic max number of digits based on the value itself. to only show significant part
      Math.min(4 - Math.round(Math.log10(Math.abs(floatValue))), magnitude)
    )
  );

  // NB we might need to make this a more "rich" object, because we might apply diff styles
  const format =
    (alwaysShowSign && floatValue > 0 ? "+" + nonBreakableSpace : "") +
    (showCode ? code : "") +
    nonBreakableSpace +
    floatValue.toLocaleString("en-EN", {
      maximumFractionDigits,
      minimumFractionDigits
    });
  return format;
}

// Infer the currency unit. works with fiat too.
export function inferUnit(
  currencies: Array<Currency>,
  currencyName: string
): Unit {
  // try to find a countervalues unit
  if (currencyName in fiatUnits) {
    return fiatUnits[currencyName];
  } else {
    // try to find a crypto currencies unit
    const currency = getCurrency(currencies, currencyName);
    if (currency) {
      // TODO: this will depend on user pref (if you select mBTC vs BTC , etc..)
      // we might have a redux store that store user prefered unit per currencyName
      const unit = currency.units[0];
      if (!unit) {
        throw new Error(`currency "${currencyName}" have no units`);
      }
      return unit;
    } else {
      throw new Error(`currency "${currencyName}" not found`);
    }
  }
}
