//@flow
import FiatUnits from "./fiat-units";

// This contains all the flow types for the Data Model (coming from the API)
// We have a little variation with the way client denormalize the data,
// therefore we will have _T_Entity types to be the denormalized form of _T_

export type Fiat = $Keys<typeof FiatUnits>;

export type Rate = {
  value: number,
  fiat: Fiat
};

export type Unit = {
  name: string,
  code: string,
  symbol: string,
  magnitude: number,
  showAllDigits?: boolean
};

export type Currency = {
  name: string,
  family: string,
  color: string,
  units: Unit[]
};
export type CurrencyEntity = Currency;
