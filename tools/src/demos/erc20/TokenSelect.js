// @flow
import React, { useState, useEffect } from "react";
import Select from "react-select";
import { listTokens } from "@ledgerhq/live-common/lib/currencies";
import type { TokenCurrency } from "@ledgerhq/live-common/lib/types";
import api from "@ledgerhq/live-common/lib/countervalues/api";

let tickers;
const tickersP = api.fetchMarketcapTickers().then((t) => {
  tickers = t;
  return t;
});

const rank = (token) => {
  const i = tickers.indexOf(token.ticker);
  if (i === -1) return Infinity;
  return i;
};

const getSortedTokens = () => {
  let tokens = listTokens();
  if (!tickers) return tokens;
  return tokens.slice(0).sort((a, b) => rank(a) - rank(b));
};

type Props = {
  value: ?TokenCurrency,
  onChange: (?TokenCurrency) => void,
};

const TokenSelect = ({ value, onChange }: Props) => {
  const [tokens, setTokens] = useState(getSortedTokens);

  useEffect(() => {
    if (!tickers) {
      tickersP.then(() => setTokens(getSortedTokens()));
    }
  }, []);

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
