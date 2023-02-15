// @flow
import React from "react";
import Select from "react-select";
import {
  listCryptoCurrencies,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/lib/currencies";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";

export type DataTypeCryptoCurrency = {
  type: "cryptocurrency",
  default: CryptoCurrency,
};

type Props = {
  value: ?CryptoCurrency,
  onChange: (?CryptoCurrency) => void,
  filterFamilies?: string[],
};

const TokenSelect = ({ value, onChange, filterFamilies }: Props) => {
  let currencies = listCryptoCurrencies(true);
  if (filterFamilies) {
    currencies = currencies.filter((c) => filterFamilies.includes(c.family));
  }
  currencies = useCurrenciesByMarketcap(currencies);
  return (
    <Select
      value={value}
      options={currencies}
      onChange={onChange}
      placeholder="Select a crypto currency"
      getOptionLabel={(token) => `${token.name} (${token.ticker})`}
      getOptionValue={(token) => token.ticker}
    />
  );
};

export default TokenSelect;
