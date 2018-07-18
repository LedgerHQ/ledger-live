//@flow
import querystring from "querystring";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "../../types";
import { findCryptoCurrencyByScheme } from "../../data/cryptocurrencies";
// see https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki

type Data = {
  address: string,
  currency?: CryptoCurrency,
  amount?: BigNumber // IN SATOSHI !! not in actual 'real' value
  // ... any other field specific to a coin that will be put in query
};

export function encodeURIScheme(data: Data): string {
  const { currency, address, amount, ...specificFields } = data;
  const query: Object = { ...specificFields };
  if (!currency) return address;
  if (amount) {
    const { magnitude } = currency.units[0];
    query.amount = amount.div(BigNumber(10).pow(magnitude)).toNumber();
  }
  const queryStr = querystring.stringify(query);
  return currency.scheme + ":" + address + (queryStr ? "?" + queryStr : "");
}

export function decodeURIScheme(str: string): Data {
  const m = str.match(/(([a-zA-Z]+):)?([^?]+)(\?(.+))?/);
  if (!m) {
    // as a fallback we'll fallback str to be an address
    return { address: str };
  }
  const [, , scheme, address, , queryStr] = m;
  const query: Object = queryStr ? querystring.parse(queryStr) : {};
  const currency = findCryptoCurrencyByScheme(scheme);
  if (!currency) {
    return { address };
  }
  const data: Data = {
    currency,
    address
  };
  const { amount, ...specificFields } = { ...query };
  Object.assign(data, specificFields);
  if (amount) {
    const amountFloat = BigNumber(amount);
    if (!amountFloat.isNaN() && amountFloat.gt(0)) {
      const { magnitude } = currency.units[0];
      data.amount = amountFloat.times(BigNumber(10).pow(magnitude));
    }
  }
  return data;
}
