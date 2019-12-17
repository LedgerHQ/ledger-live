// @flow
import React, { useState, useEffect } from "react";
import Select from "react-select";
import { listTokens } from "@ledgerhq/live-common/lib/currencies";
import type { CurrencyToken } from "@ledgerhq/live-common/lib/types";
import { getCountervalues } from "@ledgerhq/live-common/lib/countervalues";

let tickers;
const tickersP = getCountervalues()
  .fetchTickersByMarketcap()
  .then(t => {
    tickers = t;
    return t;
  });

const rank = token => {
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
  value: ?CurrencyToken,
  onChange: (?CurrencyToken) => void
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
      getOptionLabel={token => `${token.name} (${token.ticker})`}
      getOptionValue={token => token.ticker}
    />
  );
};

export default TokenSelect;
