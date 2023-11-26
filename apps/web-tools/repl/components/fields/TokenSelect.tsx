import React from "react";
import Select from "react-select";
import { listTokens } from "@ledgerhq/live-common/currencies/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

type Props = {
  value?: TokenCurrency;
  onChange: (v: null | TokenCurrency) => void;
};

const TokenSelect = ({ value, onChange }: Props) => {
  const tokens = useCurrenciesByMarketcap(listTokens());
  return (
    <Select
      value={value}
      options={tokens}
      onChange={onChange}
      placeholder="Select an ERC20"
      getOptionLabel={token => `${token.name} (${token.ticker})`}
      getOptionValue={token => token.ticker}
    />
  );
};

export default TokenSelect;
