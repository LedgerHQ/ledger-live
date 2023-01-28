// @flow
import React from "react";
import Select from "react-select";
import {
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/lib/currencies";
import type { TokenCurrency } from "@ledgerhq/live-common/lib/types";

type Props = {
  value: ?TokenCurrency,
  onChange: (?TokenCurrency) => void,
};

const TokenSelect = ({ value, onChange }: Props) => {
  const tokens = useCurrenciesByMarketcap(listTokens());
  return (
    <Select
      value={value}
      options={tokens}
      onChange={onChange}
      placeholder="Select an ERC20"
      getOptionLabel={(token) => `${token.name} (${token.ticker})`}
      getOptionValue={(token) => token.ticker}
    />
  );
};

export default TokenSelect;
