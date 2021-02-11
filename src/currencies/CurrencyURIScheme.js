// @flow
import querystring from "querystring";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "../types";
import { findCryptoCurrencyByScheme } from "@ledgerhq/cryptoassets";
// see https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki

type Data = {
  address: string,
  currency?: CryptoCurrency,
  amount?: BigNumber, // IN SATOSHI !! not in actual 'real' value
  // ... any other field specific to a coin that will be put in query
  userGasLimit?: BigNumber,
  gasPrice?: BigNumber,
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

const convertedValue = (value, currency: CryptoCurrency) => {
  let float = BigNumber(value);
  if (!float.isNaN() && float.gt(0)) {
    const { magnitude } = currency.units[0];
    return float.times(BigNumber(10).pow(magnitude));
  }
};

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
    address,
  };
  const { amount, ...specificFields } = { ...query };
  if (currency.id === "ethereum") {
    if (specificFields.value) {
      data.amount = BigNumber(specificFields.value);
      if (data.amount.isNegative()) {
        data.amount = BigNumber(0);
      }
      delete specificFields.value;
    }
    if (specificFields.gas) {
      data.userGasLimit = BigNumber(specificFields.gas);
      if (data.userGasLimit.isNegative()) {
        data.userGasLimit = BigNumber(0);
      }
      delete specificFields.gas;
    }
    if (specificFields.gasPrice) {
      data.gasPrice = BigNumber(specificFields.gasPrice);
      if (data.gasPrice.isNegative()) {
        data.gasPrice = BigNumber(0);
      }
      delete specificFields.gasPrice;
    }
  }
  Object.assign(data, specificFields);
  if (
    currency.id === "bitcoin" &&
    data.address.toLowerCase().indexOf("bc1") === 0
  ) {
    data.address = data.address.toLowerCase();
  }
  if (amount) {
    const cValue = convertedValue(amount, currency);
    if (cValue) {
      data.amount = cValue;
    }
  }
  return data;
}
