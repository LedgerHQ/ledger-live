import React from "react";
import Select from "react-select";
import {
  listCryptoCurrencies,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/currencies/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type DataTypeCryptoCurrency = {
  type: "cryptocurrency";
  default: CryptoCurrency;
};

type Props = {
  value?: CryptoCurrency;
  onChange: (_: null | CryptoCurrency) => void;
  filterFamilies?: string[];
};

const TokenSelect = ({ value, onChange, filterFamilies }: Props) => {
  let currencies = listCryptoCurrencies(true);
  if (filterFamilies) {
    currencies = currencies.filter(c => filterFamilies.includes(c.family));
  }
  currencies = useCurrenciesByMarketcap(currencies);
  return (
    <Select
      value={value}
      options={currencies}
      onChange={onChange}
      placeholder="Select a crypto currency"
      getOptionLabel={token => `${token.name} (${token.ticker})`}
      getOptionValue={token => token.ticker}
    />
  );
};

export default TokenSelect;
