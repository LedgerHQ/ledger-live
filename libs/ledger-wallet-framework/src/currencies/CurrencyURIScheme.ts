import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "../bignumber";
import { getCurrenciesResolver } from "./resolver";
import type { CryptoCurrency } from "../types";
// see https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
type Data = {
  address: string;
  currency?: CryptoCurrency;
  amount?: BigNumber;
  // IN SATOSHI !! not in actual 'real' value
  // ... any other field specific to a coin that will be put in query
  userGasLimit?: BigNumber;
  gasPrice?: BigNumber;
};

const stringifyValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean" || typeof value === "bigint") return String(value);
  return "";
};

// Same output as node's querystring.stringify: spaces become %20, not + as with URLSearchParams.
const stringifyQuery = (query: Record<string, unknown>): string =>
  Object.entries(query)
    .flatMap(([key, value]) =>
      (Array.isArray(value) ? value : [value]).map(
        item => `${encodeURIComponent(key)}=${encodeURIComponent(stringifyValue(item))}`,
      ),
    )
    .join("&");

// querystring.parse's default maxKeys, which also counts empty pairs
const MAX_QUERY_FIELDS = 1000;

const parseQuery = (queryStr: string): Record<string, string | string[]> => {
  const query: Record<string, string | string[]> = Object.create(null);
  const fields = queryStr.split("&", MAX_QUERY_FIELDS).join("&");
  for (const [key, value] of new URLSearchParams(fields)) {
    const previous = query[key];
    if (previous === undefined) query[key] = value;
    else if (Array.isArray(previous)) previous.push(value);
    else query[key] = [previous, value];
  }
  return query;
};

export function encodeURIScheme(data: Data): string {
  const { currency, address, amount, ...specificFields } = data;
  const query: Record<string, any> = { ...specificFields };
  if (!currency) return address;

  if (amount) {
    const { magnitude } = currency.units[0];
    query.amount = amount.shiftedBy(-magnitude).toNumber();
  }

  const queryStr = stringifyQuery(query);
  return currency.scheme + ":" + address + (queryStr ? "?" + queryStr : "");
}

const convertedValue = (value: any, currency: CryptoCurrency) => {
  const float = parseFiniteBigNumber(value);

  if (float?.gt(0)) {
    const { magnitude } = currency.units[0];
    return float.times(new BigNumber(10).pow(magnitude));
  }
};

export function decodeURIScheme(str: string): Data {
  // Regex pattern breakdown:
  // - (([a-zA-Z0-9_-]+):(?!:))?  - Optional URI scheme (e.g., "bitcoin:", "ethereum:")
  //   - [a-zA-Z0-9_-]+            - Scheme name
  //   - :                         - Required colon after scheme
  //   - (?!:)                     - Negative lookahead: colon must NOT be followed by another colon
  //                                 This prevents matching "ldg:" in addresses like "ldg::1220..." (canton) as a scheme
  // - ([^?]+)                    - Address part (everything until '?' if present)
  // - (\?([^?]+))?               - Optional query string (e.g., "?amount=0.5")
  const m = /^(([a-zA-Z0-9_-]+):(?!:))?([^?]+)(\?([^?]+))?$/.exec(str);

  if (!m) {
    // as a fallback we'll fallback str to be an address
    return {
      address: str,
    };
  }

  const [, , scheme, address, , queryStr] = m;
  const query: Record<string, any> = queryStr ? parseQuery(queryStr) : {};
  const currency = getCurrenciesResolver().findCryptoCurrencyByScheme(scheme);

  if (!currency) {
    return {
      address,
    };
  }

  const data: Data = {
    currency,
    address,
  };
  const { amount, ...specificFields } = { ...query } as Partial<{
    amount: any;
    value: any;
    gas: any;
    gasPrice: any;
  }>;

  if (currency.id === "ethereum") {
    if (specificFields.value) {
      const valueBN = parseFiniteBigNumber(specificFields.value, { allowHex: true });

      if (valueBN) {
        data.amount = valueBN.isNegative() ? new BigNumber(0) : valueBN;
      }

      delete specificFields.value;
    }

    if (specificFields.gas) {
      const gasBN = parseFiniteBigNumber(specificFields.gas, { allowHex: true });

      if (gasBN) {
        data.userGasLimit = gasBN.isNegative() ? new BigNumber(0) : gasBN;
      }

      delete specificFields.gas;
    }

    if (specificFields.gasPrice) {
      const gasPriceBN = parseFiniteBigNumber(specificFields.gasPrice, { allowHex: true });

      if (gasPriceBN) {
        data.gasPrice = gasPriceBN.isNegative() ? new BigNumber(0) : gasPriceBN;
      }

      delete specificFields.gasPrice;
    }
  }

  Object.assign(data, specificFields);

  if (amount) {
    const cValue = convertedValue(amount, currency);

    if (cValue) {
      data.amount = cValue;
    }
  }

  return data;
}
